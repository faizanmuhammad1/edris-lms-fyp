"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  try {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: "Progress updated",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}

export async function submitQuizAttempt({
  quizId,
  lessonId,
  courseSlug,
  answers,
  timeSpent,
  cheatingCounters,
  violationLog,
}: {
  quizId: string;
  lessonId: string;
  courseSlug: string;
  answers: Record<string, string>;
  timeSpent: number | null;
  cheatingCounters?: {
    tabSwitchCount: number;
    backButtonCount: number;
    windowBlurCount: number;
    visibilityChangeCount: number;
    copyAttemptCount: number;
    pasteAttemptCount: number;
    rightClickCount: number;
    devToolsAttemptCount: number;
  };
  violationLog?: { type: string; at: string }[];
}): Promise<
  ApiResponse<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    answers: Record<string, { isCorrect: boolean; correctOptionId: string }>;
  }>
> {
  const session = await requireUser();

  try {
    // Get quiz with questions and options
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!quiz) {
      return {
        status: "error",
        message: "Quiz not found",
      };
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const answerResults: Record<
      string,
      { isCorrect: boolean; correctOptionId: string }
    > = {};

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const selectedOptionId = answers[question.id];
      const correctOption = question.options.find((opt) => opt.isCorrect);

      if (correctOption) {
        answerResults[question.id] = {
          isCorrect: selectedOptionId === correctOption.id,
          correctOptionId: correctOption.id,
        };

        if (selectedOptionId === correctOption.id) {
          correctAnswers++;
          earnedPoints += question.points;
        }
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Create quiz attempt
    await prisma.quizAttempt.create({
      data: {
        userId: session.id,
        quizId: quiz.id,
        score,
        timeSpent,
        isCompleted: true,
        submittedAt: new Date(),
        tabSwitchCount: cheatingCounters?.tabSwitchCount ?? 0,
        backButtonCount: cheatingCounters?.backButtonCount ?? 0,
        windowBlurCount: cheatingCounters?.windowBlurCount ?? 0,
        visibilityChangeCount: cheatingCounters?.visibilityChangeCount ?? 0,
        copyAttemptCount: cheatingCounters?.copyAttemptCount ?? 0,
        pasteAttemptCount: cheatingCounters?.pasteAttemptCount ?? 0,
        rightClickCount: cheatingCounters?.rightClickCount ?? 0,
        devToolsAttemptCount: cheatingCounters?.devToolsAttemptCount ?? 0,
        violationLog: violationLog ?? undefined,
        answers: {
          create: Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            optionId: optionId || null,
            isCorrect: answerResults[questionId]?.isCorrect ?? false,
          })),
        },
      },
    });

    // If passed, mark lesson as complete
    if (passed) {
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: session.id,
            lessonId: lessonId,
          },
        },
        update: {
          completed: true,
        },
        create: {
          lessonId: lessonId,
          userId: session.id,
          completed: true,
        },
      });
    }

    revalidatePath(`/dashboard/${courseSlug}/${lessonId}`);

    return {
      status: "success",
      message: passed ? "Quiz passed!" : "Quiz completed",
      data: {
        score,
        totalQuestions: quiz.questions.length,
        correctAnswers,
        passed,
        answers: answerResults,
      },
    };
  } catch (error) {
    console.error("Quiz submission error:", error);
    return {
      status: "error",
      message: "Failed to submit quiz",
    };
  }
}