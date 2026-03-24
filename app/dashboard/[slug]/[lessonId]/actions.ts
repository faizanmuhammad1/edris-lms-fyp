"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  assignmentSubmissionSchema,
  ASSIGNMENT_MAX_FILE_BYTES_DEFAULT,
  ASSIGNMENT_MAX_TEXT_LENGTH_DEFAULT,
  type AssignmentSubmissionSchemaType,
} from "@/lib/zodSchemas";
import { sanitizeAssignmentText } from "@/lib/sanitize-text";
import { runAutoGradeForSubmission } from "@/lib/grade-assignment-ai";
import { revalidatePath } from "next/cache";
import { getCourseCompletionStatus } from "@/app/data/course/get-course-completion-status";
import { sendCourseCompletionEmailIfNeeded } from "@/lib/certificate-emails";

async function maybeSendCourseCompletionEmail(
  userId: string,
  courseSlug: string
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: { id: true },
  });
  if (!course) return;

  const status = await getCourseCompletionStatus(course.id, userId);
  if (!status.isEligible) return;

  await sendCourseCompletionEmailIfNeeded({
    userId,
    courseId: course.id,
  });
}

// ── Video Progress Tracking ──────────────────────────────────────────────────

export async function saveVideoProgress(
  lessonId: string,
  data: {
    lastWatchedPosition: number;
    watchedDuration: number;
    videoDuration: number;
    watchPercentage: number;
  }
): Promise<{ success: boolean }> {
  try {
    const session = await requireUser();

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        lastWatchedPosition: data.lastWatchedPosition,
        watchedDuration: data.watchedDuration,
        videoDuration: data.videoDuration,
        watchPercentage: data.watchPercentage,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        lastWatchedPosition: data.lastWatchedPosition,
        watchedDuration: data.watchedDuration,
        videoDuration: data.videoDuration,
        watchPercentage: data.watchPercentage,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save video progress:", error);
    return { success: false };
  }
}

// ── Lesson Completion ────────────────────────────────────────────────────────

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

    try {
      await maybeSendCourseCompletionEmail(session.id, slug);
    } catch (emailError) {
      console.error("Failed sending completion email:", emailError);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${slug}`);
    revalidatePath(`/dashboard/${slug}`, 'layout'); // Force layout revalidation
    revalidatePath(`/dashboard/${slug}/${lessonId}`);

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

export async function submitAssignment(
  assignmentId: string,
  values: AssignmentSubmissionSchemaType,
  slug: string,
  lessonId: string
): Promise<ApiResponse> {
  const session = await requireUser();
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        Lesson: {
          Chapter: {
            Course: {
              enrollment: {
                some: {
                  userId: session.id,
                  status: "Active",
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        allowFile: true,
        allowText: true,
        autoGradeEnabled: true,
        maxFileSizeBytes: true,
        maxTextLength: true,
      },
    });
    if (!assignment) {
      return { status: "error", message: "Assignment not found or you are not enrolled" };
    }
    const parsed = assignmentSubmissionSchema.safeParse(values);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.errors[0]?.message ?? "Invalid submission data" };
    }
    const { fileKey, fileName, fileSize, mimeType, textAnswer: rawTextAnswer } = parsed.data;
    const maxFileBytes = assignment.maxFileSizeBytes ?? ASSIGNMENT_MAX_FILE_BYTES_DEFAULT;
    const maxTextLen = assignment.maxTextLength ?? ASSIGNMENT_MAX_TEXT_LENGTH_DEFAULT;
    if (fileSize != null && fileSize > maxFileBytes) {
      return { status: "error", message: `File size exceeds the limit (max ${Math.round(maxFileBytes / 1024 / 1024)}MB)` };
    }
    const textAnswer = sanitizeAssignmentText(rawTextAnswer);
    if (textAnswer.length > maxTextLen) {
      return { status: "error", message: `Text answer must be at most ${maxTextLen.toLocaleString()} characters` };
    }
    const hasFile = !!fileKey;
    const hasText = !!textAnswer.trim();
    if (assignment.allowFile && assignment.allowText && !hasFile && !hasText) {
      return { status: "error", message: "Please provide a file and/or text answer" };
    }
    if (assignment.allowFile && !assignment.allowText && !hasFile) {
      return { status: "error", message: "Please upload a file" };
    }
    if (assignment.allowText && !assignment.allowFile && !hasText) {
      return { status: "error", message: "Please provide a text answer" };
    }
    const existing = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId: session.id } },
    });
    if (existing?.status === "Graded") {
      return { status: "error", message: "Already graded; resubmission not allowed" };
    }
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: session.id } },
      create: {
        assignmentId,
        userId: session.id,
        fileKey: fileKey ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        mimeType: mimeType ?? null,
        textAnswer: textAnswer || null,
        status: "Submitted",
      },
      update: {
        fileKey: fileKey ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        mimeType: mimeType ?? null,
        textAnswer: textAnswer || null,
        status: "Submitted",
      },
    });

    // Assignment submission counts as lesson completion for certificate eligibility
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId,
        },
      },
      update: { completed: true },
      create: {
        lessonId,
        userId: session.id,
        completed: true,
      },
    });

    try {
      await maybeSendCourseCompletionEmail(session.id, slug);
    } catch (emailError) {
      console.error("Failed sending completion email:", emailError);
    }

    if (assignment.autoGradeEnabled && hasText) {
      runAutoGradeForSubmission(submission.id).catch(() => {});
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${slug}`);
    revalidatePath(`/dashboard/${slug}`, "layout");
    revalidatePath(`/dashboard/${slug}/${lessonId}`);
    revalidatePath(`/dashboard/certificate/${slug}`);
    return { status: "success", message: "Submission saved" };
  } catch {
    return { status: "error", message: "Failed to submit" };
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

      try {
        await maybeSendCourseCompletionEmail(session.id, courseSlug);
      } catch (emailError) {
        console.error("Failed sending completion email:", emailError);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${courseSlug}`);
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