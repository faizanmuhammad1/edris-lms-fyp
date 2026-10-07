"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  assignmentSubmissionSchema,
  ASSIGNMENT_MAX_FILE_BYTES_DEFAULT,
  ASSIGNMENT_MAX_TEXT_LENGTH_DEFAULT,
  resolveAssignmentUploadMime,
  type AssignmentSubmissionSchemaType,
} from "@/lib/zodSchemas";
import { sanitizeAssignmentText } from "@/lib/sanitize-text";
import { runAutoGradeForSubmission } from "@/lib/grade-assignment-ai";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getCourseCompletionStatus } from "@/app/data/course/get-course-completion-status";
import { sendCourseCompletionEmailIfNeeded } from "@/lib/certificate-emails";

/** Returns the lesson only if the user has an Active enrollment in its course. */
async function findEnrolledLesson(lessonId: string, userId: string) {
  if (typeof lessonId !== "string" || !lessonId) return null;
  return prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: {
        Course: {
          enrollment: { some: { userId, status: "Active" } },
        },
      },
    },
    select: { id: true, Chapter: { select: { Course: { select: { slug: true } } } } },
  });
}

function clampNumber(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(Math.max(n, min), max);
}

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
  const session = await requireUser();

  try {
    const lesson = await findEnrolledLesson(lessonId, session.id);
    if (!lesson) return { success: false };

    const progress = {
      lastWatchedPosition: clampNumber(data?.lastWatchedPosition, 0, 1e7),
      watchedDuration: clampNumber(data?.watchedDuration, 0, 1e7),
      videoDuration: clampNumber(data?.videoDuration, 0, 1e7),
      watchPercentage: clampNumber(data?.watchPercentage, 0, 100),
    };

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lesson.id,
        },
      },
      update: progress,
      create: {
        lessonId: lesson.id,
        userId: session.id,
        ...progress,
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
    const lesson = await findEnrolledLesson(lessonId, session.id);
    if (!lesson) {
      return { status: "error", message: "Lesson not found or you are not enrolled" };
    }
    slug = lesson.Chapter.Course.slug;

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lesson.id,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lesson.id,
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
        lessonId: true,
        allowFile: true,
        allowText: true,
        autoGradeEnabled: true,
        allowedFileTypes: true,
        maxFileSizeBytes: true,
        maxTextLength: true,
        Lesson: { select: { Chapter: { select: { Course: { select: { slug: true } } } } } },
      },
    });
    if (!assignment) {
      return { status: "error", message: "Assignment not found or you are not enrolled" };
    }
    // Trust the assignment's own lesson/course, not client-supplied ids.
    lessonId = assignment.lessonId;
    slug = assignment.Lesson.Chapter.Course.slug;
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
    if (fileKey && !assignment.allowFile) {
      return { status: "error", message: "This assignment does not accept file uploads" };
    }
    // Validate file type against teacher-configured restrictions
    let resolvedMimeType = mimeType ?? null;
    if (fileKey && assignment.allowedFileTypes) {
      resolvedMimeType = resolveAssignmentUploadMime(
        fileName ?? fileKey,
        mimeType,
        assignment.allowedFileTypes
      );
      if (!resolvedMimeType) {
        const typeLabels: Record<string, string> = { pdf: "PDF", image: "images", word: "Word documents", text: "text files", zip: "ZIP archives" };
        const allowedLabels = assignment.allowedFileTypes
          .split(",")
          .map((t) => typeLabels[t.trim()] ?? t.trim())
          .join(", ");
        return { status: "error", message: `This assignment only accepts: ${allowedLabels}` };
      }
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
    // New uploads are keyed under the uploader's prefix by /api/s3/upload-direct, so a
    // submission can never point at another user's file or at course content.
    if (fileKey && fileKey !== existing?.fileKey && !fileKey.startsWith(`submissions/${session.id}/`)) {
      return { status: "error", message: "Invalid file upload. Please upload your file again." };
    }
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: session.id } },
      create: {
        assignmentId,
        userId: session.id,
        fileKey: fileKey ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        mimeType: fileKey ? resolvedMimeType : null,
        textAnswer: textAnswer || null,
        status: "Submitted",
      },
      update: {
        fileKey: fileKey ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        mimeType: fileKey ? resolvedMimeType : null,
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

    if (assignment.autoGradeEnabled && (hasText || hasFile)) {
      // after() keeps the serverless function alive until grading finishes.
      after(() =>
        runAutoGradeForSubmission(submission.id).catch((err) =>
          console.error("Auto-grading failed:", err)
        )
      );
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
    answers: Record<string, { isCorrect: boolean; correctOptionId: string | null }>;
  }>
> {
  const session = await requireUser();

  try {
    // Only published quizzes in a course the student is actively enrolled in.
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        isPublished: true,
        Lesson: {
          Chapter: {
            Course: {
              enrollment: { some: { userId: session.id, status: "Active" } },
            },
          },
        },
      },
      include: {
        Lesson: { select: { Chapter: { select: { Course: { select: { slug: true } } } } } },
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
    // Trust the quiz's own lesson/course, not client-supplied ids.
    lessonId = quiz.lessonId;
    courseSlug = quiz.Lesson.Chapter.Course.slug;

    const submittedAnswers: Record<string, string> =
      answers && typeof answers === "object" ? answers : {};

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: { questionId: string; optionId: string | null; isCorrect: boolean }[] = [];
    const answerResults: Record<
      string,
      { isCorrect: boolean; correctOptionId: string }
    > = {};

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const submittedOptionId = submittedAnswers[question.id];
      // Ignore option ids that don't belong to this question.
      const selectedOptionId = question.options.some((opt) => opt.id === submittedOptionId)
        ? submittedOptionId
        : null;
      const correctOption = question.options.find((opt) => opt.isCorrect);
      const isCorrect = !!correctOption && selectedOptionId === correctOption.id;

      if (correctOption) {
        answerResults[question.id] = {
          isCorrect,
          correctOptionId: correctOption.id,
        };
      }
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points;
      }
      if (selectedOptionId) {
        gradedAnswers.push({ questionId: question.id, optionId: selectedOptionId, isCorrect });
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
        timeSpent:
          typeof timeSpent === "number" && Number.isFinite(timeSpent) && timeSpent >= 0
            ? Math.round(timeSpent)
            : null,
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
        violationLog: Array.isArray(violationLog) ? violationLog.slice(0, 500) : undefined,
        answers: {
          create: gradedAnswers,
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
        // Reveal the correct options only once the quiz is passed, so retries can't be brute-forced.
        answers: Object.fromEntries(
          Object.entries(answerResults).map(([questionId, result]) => [
            questionId,
            {
              isCorrect: result.isCorrect,
              correctOptionId: passed ? result.correctOptionId : null,
            },
          ])
        ),
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

/**
 * Poll the current grading status of a submission.
 * Used by the student UI to show a grading animation while AI grades in background.
 */
export async function getSubmissionStatus(submissionId: string) {
  const session = await requireUser();
  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId, userId: session.id },
    select: {
      status: true,
      score: true,
      feedback: true,
      gradedAt: true,
      gradingMethod: true,
    },
  });
  return submission;
}