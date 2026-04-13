"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  assignmentSchema,
  gradeSubmissionSchema,
  type AssignmentSchemaType,
  type GradeSubmissionSchemaType,
} from "@/lib/zodSchemas";
import { gradeAssignmentWithAI } from "@/lib/grade-assignment-ai";
import { revalidatePath } from "next/cache";

export async function createOrUpdateAssignment(
  lessonId: string,
  values: AssignmentSchemaType
): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      include: { Chapter: { select: { courseId: true } } },
    });
    if (!lesson) {
      return { status: "error", message: "Lesson not found" };
    }
    const parsed = assignmentSchema.safeParse(values);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.errors[0]?.message ?? "Invalid data" };
    }
    const { title, description, dueDate, maxScore, allowFile, allowText, autoGradeEnabled, maxFileSizeBytes, maxTextLength } = parsed.data;
    await prisma.assignment.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title,
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ?? null,
        allowFile,
        allowText,
        autoGradeEnabled: autoGradeEnabled ?? false,
        maxFileSizeBytes: maxFileSizeBytes ?? null,
        maxTextLength: maxTextLength ?? null,
      },
      update: {
        title,
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ?? null,
        allowFile,
        allowText,
        autoGradeEnabled: autoGradeEnabled ?? false,
        maxFileSizeBytes: maxFileSizeBytes ?? null,
        maxTextLength: maxTextLength ?? null,
      },
    });
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/edit`);
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}/assignment`);
    return { status: "success", message: "Assignment saved" };
  } catch {
    return { status: "error", message: "Failed to save assignment" };
  }
}

export async function gradeSubmission(
  submissionId: string,
  values: GradeSubmissionSchemaType
): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        Assignment: {
          Lesson: { Chapter: { Course: { userId: session.user.id } } },
        },
      },
      include: {
        Assignment: {
          include: {
            Lesson: {
              include: {
                Chapter: {
                  select: {
                    courseId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!submission) {
      return { status: "error", message: "Submission not found" };
    }
    const parsed = gradeSubmissionSchema.safeParse(values);
    if (!parsed.success) {
      return { status: "error", message: "Invalid data" };
    }
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: "Graded",
        score: parsed.data.score ?? null,
        feedback: parsed.data.feedback ?? null,
        gradedAt: new Date(),
        gradedById: session.user.id,
        gradingMethod: "Manual",
      },
    });
    const courseId = submission.Assignment.Lesson.Chapter.courseId;
    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath(`/teacher/courses/${courseId}/${submission.Assignment.Lesson.chapterId}/${submission.Assignment.lessonId}/assignment`);
    return { status: "success", message: "Submission graded" };
  } catch {
    return { status: "error", message: "Failed to grade" };
  }
}

export type GradeWithAIResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string; code?: "NO_CONTENT" | "MANUAL_REQUIRED" | "GENERATION_FAILED" };

export async function gradeSubmissionWithAI(submissionId: string): Promise<GradeWithAIResult> {
  const session = await requireTeacher();
  try {
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        Assignment: {
          Lesson: { Chapter: { Course: { userId: session.user.id } } },
        },
      },
      include: {
        Assignment: {
          select: {
            id: true,
            lessonId: true,
            title: true,
            description: true,
            maxScore: true,
            Lesson: {
              select: {
                chapterId: true,
                Chapter: { select: { courseId: true } },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return { status: "error", message: "Submission not found", code: "GENERATION_FAILED" };
    }

    const hasText = !!submission.textAnswer?.trim();
    const hasFile = !!submission.fileKey;

    if (!hasText && !hasFile) {
      return {
        status: "error",
        message: "No content to grade. The submission is empty.",
        code: "NO_CONTENT",
      };
    }

    const { score, feedback, teacherFeedback } = await gradeAssignmentWithAI({
      assignmentTitle: submission.Assignment.title,
      assignmentDescription: submission.Assignment.description,
      maxScore: submission.Assignment.maxScore,
      textAnswer: submission.textAnswer,
      fileKey: submission.fileKey,
      fileName: submission.fileName,
      mimeType: submission.mimeType,
    });

    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: "Graded",
        score,
        feedback,
        teacherFeedback: teacherFeedback || null,
        gradedAt: new Date(),
        gradedById: null,
        gradingMethod: "AI",
        gradedByAiAt: new Date(),
      },
    });

    const courseId = submission.Assignment.Lesson.Chapter.courseId;
    const lessonId = submission.Assignment.lessonId;
    const chapterId = submission.Assignment.Lesson.chapterId;
    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath(`/teacher/courses/${courseId}/${chapterId}/${lessonId}/assignment`);

    return { status: "success", message: "Submission graded with AI" };
  } catch (e) {
    console.error("AI grading error:", e);
    return {
      status: "error",
      message: "Auto-grading failed. Please grade manually.",
      code: "GENERATION_FAILED",
    };
  }
}
