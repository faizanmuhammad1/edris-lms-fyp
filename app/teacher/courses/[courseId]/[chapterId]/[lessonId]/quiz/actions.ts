"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import {
  generateQuizQuestionsFromTranscript,
  type QuizGenerateOptions,
  type GeneratedQuestion,
} from "@/lib/generate-quiz-questions";

// Every action returns an ApiResponse instead of throwing: Next.js redacts thrown error
// messages in production, so returning them is the only way the teacher sees the reason.
// requireTeacher() stays outside try/catch so its redirects are never swallowed.

// -----------------------------------------------------------------------------
// VALIDATION
// -----------------------------------------------------------------------------

type QuestionInput = {
  question: string;
  points?: number;
  options: { id?: string; text: string; isCorrect: boolean }[];
};

/** Returns an error message if the question could never be graded/passed correctly. */
function validateQuestionInput(data: QuestionInput): string | null {
  if (!data || typeof data.question !== "string" || !data.question.trim()) {
    return "Question text is required";
  }
  const points = data.points ?? 1;
  if (!Number.isInteger(points) || points < 1) {
    return "Points must be a whole number of at least 1";
  }
  if (!Array.isArray(data.options) || data.options.length < 2) {
    return "A question must have at least 2 options";
  }
  if (data.options.some((opt) => typeof opt?.text !== "string" || !opt.text.trim())) {
    return "All options must have text";
  }
  if (data.options.filter((opt) => opt.isCorrect).length !== 1) {
    return "Exactly one option must be marked correct";
  }
  return null;
}

function quizPath(courseId: string, chapterId: string, lessonId: string) {
  return `/teacher/courses/${courseId}/${chapterId}/${lessonId}/quiz`;
}

/** Loads a quiz only if it belongs to the signed-in teacher. */
async function findOwnedQuiz(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
  });
  if (!quiz || quiz.Lesson.Chapter.Course.userId !== userId) return null;
  return quiz;
}

// -----------------------------------------------------------------------------
// QUIZ ACTIONS
// -----------------------------------------------------------------------------

export async function upsertQuiz(
  lessonId: string,
  data: {
    title: string;
    description?: string;
    isPublished?: boolean;
    passingScore?: number;
  }
): Promise<ApiResponse<{ quizId: string }>> {
  const session = await requireTeacher();

  try {
    // 1. Verify Ownership
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      include: { Chapter: true },
    });

    if (!lesson) {
      return { status: "error", message: "Lesson not found or you don't have access to it" };
    }

    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title) {
      return { status: "error", message: "Quiz title is required" };
    }

    if (
      data.passingScore !== undefined &&
      (!Number.isInteger(data.passingScore) || data.passingScore < 0 || data.passingScore > 100)
    ) {
      return { status: "error", message: "Passing score must be a whole number between 0 and 100" };
    }

    // 2. A published quiz must be passable: at least one question, each worth >= 1 point
    //    with exactly one correct option.
    if (data.isPublished) {
      const existingQuiz = await prisma.quiz.findUnique({
        where: { lessonId },
        select: {
          questions: {
            select: { points: true, options: { select: { isCorrect: true } } },
          },
        },
      });
      const questions = existingQuiz?.questions ?? [];
      if (questions.length === 0) {
        return { status: "error", message: "Add at least one question before publishing the quiz" };
      }
      const invalidCount = questions.filter(
        (q) =>
          q.points < 1 ||
          q.options.length < 2 ||
          q.options.filter((o) => o.isCorrect).length !== 1
      ).length;
      if (invalidCount > 0) {
        return {
          status: "error",
          message: `${invalidCount} question(s) need exactly one correct option and at least 1 point before publishing`,
        };
      }
    }

    // 3. Upsert Quiz
    const quiz = await prisma.quiz.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title,
        description: data.description,
        isPublished: data.isPublished ?? false,
        passingScore: data.passingScore ?? 70,
      },
      update: {
        title,
        description: data.description,
        isPublished: data.isPublished,
        passingScore: data.passingScore,
      },
    });

    revalidatePath(quizPath(lesson.Chapter.courseId, lesson.chapterId, lessonId));
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    return { status: "success", message: "Quiz saved", data: { quizId: quiz.id } };
  } catch (error) {
    console.error("upsertQuiz failed:", error);
    return { status: "error", message: "Couldn't save the quiz. Please try again." };
  }
}

export async function deleteQuiz(lessonId: string): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      include: { Chapter: true },
    });

    if (!lesson) {
      return { status: "error", message: "Lesson not found or you don't have access to it" };
    }

    const existing = await prisma.quiz.findUnique({ where: { lessonId }, select: { id: true } });
    if (!existing) {
      return { status: "error", message: "This quiz has already been deleted" };
    }

    await prisma.quiz.delete({
      where: { lessonId },
    });

    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    revalidatePath(quizPath(lesson.Chapter.courseId, lesson.chapterId, lessonId));
    return { status: "success", message: "Quiz deleted" };
  } catch (error) {
    console.error("deleteQuiz failed:", error);
    return { status: "error", message: "Couldn't delete the quiz. Please try again." };
  }
}

// -----------------------------------------------------------------------------
// QUESTION ACTIONS
// -----------------------------------------------------------------------------

export async function createQuestion(
  quizId: string,
  data: {
    question: string;
    points?: number;
    options: { text: string; isCorrect: boolean }[];
  }
): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    // 1. Verify Quiz + Ownership
    const quiz = await findOwnedQuiz(quizId, session.user.id);
    if (!quiz) {
      return { status: "error", message: "Quiz not found or you don't have access to it" };
    }

    const validationError = validateQuestionInput(data);
    if (validationError) {
      return { status: "error", message: validationError };
    }

    // 2. Get Max Position
    const maxPos = await prisma.quizQuestion.findFirst({
      where: { quizId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    // 3. Create Question with Options
    await prisma.quizQuestion.create({
      data: {
        quizId,
        question: data.question.trim(),
        points: data.points ?? 1,
        position: (maxPos?.position ?? 0) + 1,
        options: {
          create: data.options.map((opt, idx) => ({
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            position: idx + 1,
          })),
        },
      },
    });

    revalidatePath(quizPath(quiz.Lesson.Chapter.courseId, quiz.Lesson.chapterId, quiz.lessonId));
    return { status: "success", message: "Question added" };
  } catch (error) {
    console.error("createQuestion failed:", error);
    return { status: "error", message: "Couldn't add the question. Please try again." };
  }
}

export async function updateQuestion(
  questionId: string,
  data: {
    question: string;
    points?: number;
    // `id` identifies an existing option so it is updated in place; options without
    // an id are created. Existing options not present are deleted.
    options: { id?: string; text: string; isCorrect: boolean }[];
  }
): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    const existing = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: {
        options: { select: { id: true } },
        Quiz: { include: { Lesson: { include: { Chapter: { include: { Course: true } } } } } },
      },
    });

    if (!existing || existing.Quiz.Lesson.Chapter.Course.userId !== session.user.id) {
      return { status: "error", message: "Question not found or you don't have access to it" };
    }

    const validationError = validateQuestionInput(data);
    if (validationError) {
      return { status: "error", message: validationError };
    }

    // Update options in place (by id) so QuizAnswer.optionId references from past
    // attempts stay valid; only create new options / delete removed ones.
    const existingIds = new Set(existing.options.map((o) => o.id));
    const keptIds = new Set<string>();
    const plan = data.options.map((opt, idx) => {
      const keep = !!opt.id && existingIds.has(opt.id) && !keptIds.has(opt.id);
      if (keep) keptIds.add(opt.id!);
      return {
        id: keep ? opt.id! : null,
        text: opt.text.trim(),
        isCorrect: opt.isCorrect,
        position: idx + 1,
      };
    });

    await prisma.$transaction(async (tx) => {
      await tx.quizQuestion.update({
        where: { id: questionId },
        data: {
          question: data.question.trim(),
          points: data.points ?? 1,
        },
      });

      await tx.quizOption.deleteMany({
        where: { questionId, id: { notIn: Array.from(keptIds) } },
      });

      // Move kept options to temporary positions first to avoid
      // @@unique([questionId, position]) collisions while reordering.
      let tempPosition = -1;
      for (const id of keptIds) {
        await tx.quizOption.update({ where: { id }, data: { position: tempPosition-- } });
      }

      for (const opt of plan) {
        if (opt.id) {
          await tx.quizOption.update({
            where: { id: opt.id },
            data: { text: opt.text, isCorrect: opt.isCorrect, position: opt.position },
          });
        } else {
          await tx.quizOption.create({
            data: {
              questionId,
              text: opt.text,
              isCorrect: opt.isCorrect,
              position: opt.position,
            },
          });
        }
      }
    });

    revalidatePath(
      quizPath(existing.Quiz.Lesson.Chapter.courseId, existing.Quiz.Lesson.chapterId, existing.Quiz.lessonId)
    );
    return { status: "success", message: "Question updated" };
  } catch (error) {
    console.error("updateQuestion failed:", error);
    return { status: "error", message: "Couldn't update the question. Please try again." };
  }
}

export async function deleteQuestion(questionId: string): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    // 1. Verify Ownership
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { Quiz: { include: { Lesson: { include: { Chapter: { include: { Course: true } } } } } } },
    });

    if (!question || question.Quiz.Lesson.Chapter.Course.userId !== session.user.id) {
      return { status: "error", message: "Question not found or you don't have access to it" };
    }

    // A published quiz must keep at least one question (otherwise it can never be passed)
    if (question.Quiz.isPublished) {
      const questionCount = await prisma.quizQuestion.count({ where: { quizId: question.quizId } });
      if (questionCount <= 1) {
        return {
          status: "error",
          message: "Unpublish the quiz before deleting its last question",
        };
      }
    }

    // 2. Delete
    await prisma.quizQuestion.delete({ where: { id: questionId } });

    revalidatePath(
      quizPath(question.Quiz.Lesson.Chapter.courseId, question.Quiz.Lesson.chapterId, question.Quiz.lessonId)
    );
    return { status: "success", message: "Question deleted" };
  } catch (error) {
    console.error("deleteQuestion failed:", error);
    return { status: "error", message: "Couldn't delete the question. Please try again." };
  }
}

export async function updateQuestionOrder(
  quizId: string,
  items: { id: string; position: number }[]
): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    // Verify the teacher owns this quiz
    const quiz = await findOwnedQuiz(quizId, session.user.id);
    if (!quiz) {
      return { status: "error", message: "Quiz not found or you don't have access to it" };
    }

    if (
      !Array.isArray(items) ||
      items.some((item) => typeof item?.id !== "string" || !Number.isInteger(item.position))
    ) {
      return { status: "error", message: "Invalid question order" };
    }

    // Scope every update to this quiz so client-supplied ids from other quizzes are ignored
    const transaction = items.map((item) =>
      prisma.quizQuestion.updateMany({
        where: { id: item.id, quizId },
        data: { position: item.position },
      })
    );

    await prisma.$transaction(transaction);
    revalidatePath(quizPath(quiz.Lesson.Chapter.courseId, quiz.Lesson.chapterId, quiz.lessonId));
    return { status: "success", message: "Question order saved" };
  } catch (error) {
    console.error("updateQuestionOrder failed:", error);
    return { status: "error", message: "Couldn't save the new question order. Please try again." };
  }
}

// -----------------------------------------------------------------------------
// AI QUIZ GENERATION
// -----------------------------------------------------------------------------

export type GenerateQuizQuestionsResult =
  | { success: true; questions: GeneratedQuestion[] }
  | { success: false; error: "NO_TRANSCRIPT" | "GENERATION_FAILED" };

export async function generateQuizQuestions(
  lessonId: string,
  options: QuizGenerateOptions
): Promise<GenerateQuizQuestionsResult> {
  const session = await requireTeacher();

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      select: {
        id: true,
        transcript: true,
        transcriptionStatus: true,
      },
    });

    if (!lesson) {
      return { success: false, error: "GENERATION_FAILED" };
    }

    if (lesson.transcriptionStatus !== "COMPLETED" || !lesson.transcript?.trim()) {
      return { success: false, error: "NO_TRANSCRIPT" };
    }

    const numQuestions = Math.min(20, Math.max(1, Math.round(Number(options?.numQuestions) || 5)));
    const difficulty = (["easy", "medium", "hard"] as const).includes(options?.difficulty)
      ? options.difficulty
      : "medium";

    const questions = await generateQuizQuestionsFromTranscript(lessonId, {
      ...options,
      numQuestions,
      difficulty,
    });
    return { success: true, questions };
  } catch (error) {
    console.error("generateQuizQuestions failed:", error);
    return { success: false, error: "GENERATION_FAILED" };
  }
}

export async function addGeneratedQuestions(
  quizId: string,
  questions: GeneratedQuestion[]
): Promise<ApiResponse<{ added: number }>> {
  const session = await requireTeacher();

  try {
    const quiz = await findOwnedQuiz(quizId, session.user.id);
    if (!quiz) {
      return { status: "error", message: "Quiz not found or you don't have access to it" };
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return { status: "error", message: "Select at least one question to add" };
    }

    const invalid = questions.find((q) => validateQuestionInput({ ...q, points: 1 }) !== null);
    if (invalid) {
      return {
        status: "error",
        message: "Every question needs text and at least 2 options with exactly one correct answer",
      };
    }

    const maxPos = await prisma.quizQuestion.findFirst({
      where: { quizId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    let nextPosition = (maxPos?.position ?? 0) + 1;

    // All-or-nothing so a failure never leaves half of the generated set behind.
    await prisma.$transaction(
      questions.map((q) =>
        prisma.quizQuestion.create({
          data: {
            quizId,
            question: q.question.trim(),
            points: 1,
            position: nextPosition++,
            options: {
              create: q.options.map((opt, idx) => ({
                text: opt.text.trim(),
                isCorrect: opt.isCorrect,
                position: idx + 1,
              })),
            },
          },
        })
      )
    );

    revalidatePath(quizPath(quiz.Lesson.Chapter.courseId, quiz.Lesson.chapterId, quiz.lessonId));
    return {
      status: "success",
      message: `Added ${questions.length} question${questions.length === 1 ? "" : "s"} to the quiz`,
      data: { added: questions.length },
    };
  } catch (error) {
    console.error("addGeneratedQuestions failed:", error);
    return { status: "error", message: "Couldn't add the generated questions. Please try again." };
  }
}
