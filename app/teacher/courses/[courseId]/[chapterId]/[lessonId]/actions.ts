"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { triggerMuxAssetCreation } from "@/lib/mux-trigger";
import { triggerTranscriptionForLesson } from "@/lib/transcription";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import openai from "@/lib/openai";
import { z } from "zod";

export async function updateTeacherLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    // Verify teacher owns this lesson
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: {
          Course: {
            userId: session.user.id,
          },
        },
      },
      include: { attachments: { select: { id: true } } },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found or you don't have permission to edit it",
      };
    }

    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    if (result.data.lessonType === "Reading") {
      const hasContent =
        (result.data.description && result.data.description.trim().length > 0) ||
        !!result.data.pdfKey ||
        (lesson.attachments && lesson.attachments.length > 0);
      if (!hasContent) {
        return {
          status: "error",
          message: "Reading lessons must have at least one of: description, PDF, or an attachment",
        };
      }
    }

    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
        lessonType: result.data.lessonType ?? undefined,
        pdfKey: result.data.pdfKey ?? null,
        pdfFileName: result.data.pdfFileName ?? null,
      },
    });

    // Trigger Mux asset creation in the background if video is present
    if (result.data.videoKey) {
      triggerMuxAssetCreation(lessonId, result.data.videoKey).catch((err) =>
        console.error("[Mux] Background trigger failed:", err)
      );
      triggerTranscriptionForLesson(lessonId).catch(() => { });
    }

    return {
      status: "success",
      message: "Lesson updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update lesson",
    };
  }
}

export async function createLessonAttachment(
  lessonId: string,
  data: { fileKey: string; fileName: string; fileSize: number; mimeType: string }
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireTeacher();
  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      include: {
        attachments: { orderBy: { position: "desc" }, take: 1 },
        Chapter: { select: { courseId: true } },
      },
    });
    if (!lesson) {
      return { status: "error", message: "Lesson not found" };
    }
    const position = (lesson.attachments[0]?.position ?? 0) + 1;
    const attachment = await prisma.lessonAttachment.create({
      data: {
        lessonId,
        fileKey: data.fileKey,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        position,
      },
    });
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/edit`);
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    return { status: "success", message: "Attachment added", data: { id: attachment.id } };
  } catch {
    return { status: "error", message: "Failed to add attachment" };
  }
}

export async function deleteLessonAttachment(attachmentId: string): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    const attachment = await prisma.lessonAttachment.findFirst({
      where: {
        id: attachmentId,
        Lesson: { Chapter: { Course: { userId: session.user.id } } },
      },
      include: { Lesson: { include: { Chapter: { select: { courseId: true } } } } },
    });
    if (!attachment) {
      return { status: "error", message: "Attachment not found" };
    }
    await prisma.lessonAttachment.delete({ where: { id: attachmentId } });
    const courseId = attachment.Lesson.Chapter.courseId;
    const lessonId = attachment.lessonId;
    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath(`/teacher/courses/${courseId}/${attachment.Lesson.chapterId}/${lessonId}`);
    return { status: "success", message: "Attachment removed" };
  } catch {
    return { status: "error", message: "Failed to remove attachment" };
  }
}

export async function regenerateSummary(lessonId: string): Promise<ApiResponse> {
  await requireTeacher();

  try {
    const { generateLessonSummary } = await import("@/lib/generate-summary");
    await generateLessonSummary(lessonId);

    return {
      status: "success",
      message: "Summary generated successfully",
    };
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return {
      status: "error",
      message: "Failed to generate summary",
    };
  }
}

const quizItemSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctOptionIndex: z.number().int().nonnegative(),
  explanation: z.string().optional(),
});

const quizResponseSchema = z.array(quizItemSchema).min(1);

export async function generateQuizFromTranscript(
  lessonId: string,
  opts?: { numQuestions?: number }
): Promise<ApiResponse<{ quizId: string }>> {
  const session = await requireTeacher();

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: {
          Course: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        title: true,
        transcript: true,
        Chapter: {
          select: {
            title: true,
            Course: {
              select: {
                id: true,
                title: true,
              },
            },
            id: true,
          },
        },
        quiz: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found or you do not have permission.",
      };
    }

    if (!lesson.transcript || lesson.transcript.trim().length === 0) {
      return {
        status: "error",
        message:
          "This lesson does not have a transcript yet. Generate a transcript before creating a quiz.",
      };
    }

    if (lesson.quiz) {
      return {
        status: "error",
        message:
          "A quiz already exists for this lesson. Edit it instead of generating a new one.",
      };
    }

    const transcript =
      lesson.transcript.length > 40_000
        ? `${lesson.transcript.slice(
          0,
          40_000
        )}\n[Transcript truncated for quiz generation]`
        : lesson.transcript;

    const desiredCount = opts?.numQuestions ?? 8;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_output_tokens: 1200,
      instructions:
        "You are an expert course designer. Generate high-quality multiple-choice quiz questions from the given lesson transcript.",
      input: [
        {
          role: "user",
          content: `Create ${desiredCount} multiple-choice questions (MCQs) from this lesson transcript.

Return ONLY valid JSON in the following format (no markdown):
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Short explanation of why the correct answer is correct"
  }
]

Rules:
- Questions must be answerable using ONLY the transcript.
- Vary difficulty (some basic recall, some conceptual understanding).
- Options must be clearly distinct.
- correctOptionIndex is the zero-based index into the options array.

Course: ${lesson.Chapter.Course.title}
Chapter: ${lesson.Chapter.title}
Lesson: ${lesson.title}

Transcript:
${transcript}`,
        },
      ],
    });

    const raw = response.output_text?.trim() ?? "";

    let parsed: z.infer<typeof quizResponseSchema>;
    try {
      parsed = quizResponseSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error("Failed to parse quiz JSON from OpenAI:", err, raw);
      return {
        status: "error",
        message:
          "AI returned an unexpected format while generating the quiz. Please try again.",
      };
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: `${lesson.title} – Auto-generated Quiz`,
        description: "Draft quiz generated from the lesson transcript.",
        lessonId: lesson.id,
        isPublished: false,
        questions: {
          create: parsed.map((item, index) => ({
            question: item.question,
            position: index + 1,
            points: 1,
            options: {
              create: item.options.map((opt, optIndex) => ({
                text: opt,
                isCorrect: optIndex === item.correctOptionIndex,
                position: optIndex + 1,
              })),
            },
          })),
        },
      },
    });

    const courseId = lesson.Chapter.Course.id;
    const chapterId = lesson.Chapter.id;

    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath(`/teacher/courses/${courseId}/${chapterId}/${lesson.id}`);

    return {
      status: "success",
      message:
        "Draft quiz generated successfully. Review and publish it from the quiz editor.",
      data: { quizId: quiz.id },
    };
  } catch (error) {
    console.error("Failed to generate quiz from transcript:", error);
    return {
      status: "error",
      message: "Failed to generate quiz from transcript",
    };
  }
}

const flashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

const flashcardResponseSchema = z.object({
  flashcards: z.array(flashcardSchema).min(4),
  bulletSummary: z.array(z.string()).min(3),
});

export async function generateLessonFlashcardsPreview(
  lessonId: string
): Promise<
  ApiResponse<z.infer<typeof flashcardResponseSchema>>
> {
  const session = await requireTeacher();

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      select: {
        id: true,
        title: true,
        transcript: true,
        Chapter: {
          select: {
            title: true,
            Course: { select: { title: true } },
          },
        },
      },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found or you do not have permission.",
      };
    }

    if (!lesson.transcript || lesson.transcript.trim().length === 0) {
      return {
        status: "error",
        message:
          "This lesson does not have a transcript yet. Generate a transcript before creating flashcards.",
      };
    }

    const transcript =
      lesson.transcript.length > 40_000
        ? `${lesson.transcript.slice(
          0,
          40_000
        )}\n[Transcript truncated for flashcard generation]`
        : lesson.transcript;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_output_tokens: 1200,
      instructions:
        "You are an expert teacher. Generate flashcards and a concise bullet-point summary from the lesson transcript.",
      input: [
        {
          role: "user",
          content: `From the following lesson transcript, generate:
- 10–16 flashcards for spaced repetition, and
- 5–8 bullet points summarizing the key takeaways.

Return ONLY valid JSON in the following format (no markdown):
{
  "flashcards": [
    { "front": "Question or term", "back": "Short explanation or answer" }
  ],
  "bulletSummary": [
    "Key takeaway 1",
    "Key takeaway 2"
  ]
}

Course: ${lesson.Chapter.Course.title}
Chapter: ${lesson.Chapter.title}
Lesson: ${lesson.title}

Transcript:
${transcript}`,
        },
      ],
    });

    const raw = response.output_text?.trim() ?? "";

    let parsed: z.infer<typeof flashcardResponseSchema>;
    try {
      parsed = flashcardResponseSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error("Failed to parse flashcard JSON from OpenAI:", err, raw);
      return {
        status: "error",
        message:
          "AI returned an unexpected format while generating flashcards. Please try again.",
      };
    }

    return {
      status: "success",
      message:
        "Flashcard and summary preview generated successfully. You can use these to build lesson resources.",
      data: parsed,
    };
  } catch (error) {
    console.error("Failed to generate flashcards preview:", error);
    return {
      status: "error",
      message: "Failed to generate flashcards and summary",
    };
  }
}

