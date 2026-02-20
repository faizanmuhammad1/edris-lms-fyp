"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  generateQuizQuestionsFromTranscript,
  type QuizGenerateOptions,
  type GeneratedQuestion,
} from "@/lib/generate-quiz-questions";

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
) {
    const session = await requireTeacher();

    // 1. Verify Ownership
    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            Chapter: { Course: { userId: session.user.id } },
        },
        include: { Chapter: true },
    });

    if (!lesson) throw new Error("Unauthorized or Lesson not found");

    // 2. Upsert Quiz
    const quiz = await prisma.quiz.upsert({
        where: { lessonId },
        create: {
            lessonId,
            title: data.title,
            description: data.description,
            isPublished: data.isPublished ?? false,
            passingScore: data.passingScore ?? 70,
        },
        update: {
            title: data.title,
            description: data.description,
            isPublished: data.isPublished,
            passingScore: data.passingScore,
        },
    });

    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}/quiz`);
    return { success: true, quiz };
}

export async function deleteQuiz(lessonId: string) {
    const session = await requireTeacher();

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            Chapter: { Course: { userId: session.user.id } },
        },
        include: { Chapter: true },
    });

    if (!lesson) throw new Error("Unauthorized or Lesson not found");

    await prisma.quiz.delete({
        where: { lessonId }
    });

    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    return { success: true };
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
) {
    const session = await requireTeacher();

    // 1. Verify Quiz + Ownership
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
    });

    if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Quiz not found");
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
            question: data.question,
            points: data.points ?? 1,
            position: (maxPos?.position ?? 0) + 1,
            options: {
                create: data.options.map((opt, idx) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    position: idx + 1,
                })),
            },
        },
    });

    revalidatePath(`/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`);
    return { success: true };
}

export async function updateQuestion(
    questionId: string,
    data: {
        question: string;
        points?: number;
        options: { text: string; isCorrect: boolean }[];
    }
) {
    const session = await requireTeacher();

    const existing = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: { Quiz: { include: { Lesson: { include: { Chapter: { include: { Course: true } } } } } } },
    });

    if (!existing || existing.Quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Question not found");
    }

    await prisma.quizQuestion.update({
        where: { id: questionId },
        data: {
            question: data.question,
            points: data.points ?? 1,
            options: {
                deleteMany: {},
                create: data.options.map((opt, idx) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    position: idx + 1,
                })),
            },
        },
    });

    revalidatePath(
        `/teacher/courses/${existing.Quiz.Lesson.Chapter.courseId}/${existing.Quiz.Lesson.chapterId}/${existing.Quiz.lessonId}/quiz`
    );
    return { success: true };
}

export async function deleteQuestion(questionId: string) {
    const session = await requireTeacher();

    // 1. Verify Ownership
    const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: { Quiz: { include: { Lesson: { include: { Chapter: { include: { Course: true } } } } } } }
    });

    if (!question || question.Quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    // 2. Delete
    await prisma.quizQuestion.delete({ where: { id: questionId } });

    revalidatePath(`/teacher/courses/${question.Quiz.Lesson.Chapter.courseId}/${question.Quiz.Lesson.chapterId}/${question.Quiz.lessonId}/quiz`);
    return { success: true };
}

export async function updateQuestionOrder(quizId: string, items: { id: string; position: number }[]) {
    const session = await requireTeacher();
    // Ownership check omitted for brevity but strictly required in prod.
    // Assuming context is safe for now or relies on previous checks if we wrap.
    // Ideally duplicate ownership check here:
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
    });

    if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Quiz not found");
    }

    const transaction = items.map((item) =>
        prisma.quizQuestion.update({
            where: { id: item.id },
            data: { position: item.position }
        })
    );

    await prisma.$transaction(transaction);
    revalidatePath(`/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`);
    return { success: true };
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

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: { Course: { userId: session.user.id } },
    },
    select: {
      id: true,
      transcript: true,
      transcriptionStatus: true,
      chapterId: true,
      Chapter: { select: { courseId: true } },
    },
  });

  if (!lesson) {
    return { success: false, error: "GENERATION_FAILED" };
  }

  if (lesson.transcriptionStatus !== "COMPLETED" || !lesson.transcript?.trim()) {
    return { success: false, error: "NO_TRANSCRIPT" };
  }

  try {
    const questions = await generateQuizQuestionsFromTranscript(lessonId, options);
    return { success: true, questions };
  } catch {
    return { success: false, error: "GENERATION_FAILED" };
  }
}

export async function addGeneratedQuestions(
  quizId: string,
  questions: GeneratedQuestion[]
): Promise<{ success: boolean; error?: string }> {
  const session = await requireTeacher();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
  });

  if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
    return { success: false, error: "Unauthorized or Quiz not found" };
  }

  if (questions.length === 0) {
    return { success: true };
  }

  const maxPos = await prisma.quizQuestion.findFirst({
    where: { quizId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let nextPosition = (maxPos?.position ?? 0) + 1;

  for (const q of questions) {
    await prisma.quizQuestion.create({
      data: {
        quizId,
        question: q.question,
        points: 1,
        position: nextPosition++,
        options: {
          create: q.options.map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            position: idx + 1,
          })),
        },
      },
    });
  }

  revalidatePath(
    `/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`
  );
  return { success: true };
}
