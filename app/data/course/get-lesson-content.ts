import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { cache } from "react";

// Cached per request so generateMetadata and the page share one query.
export const getLessonContent = cache(async (lessonId: string) => {
  const session = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      muxPlaybackId: true,
      muxStatus: true,
      position: true,
      lessonType: true,
      pdfKey: true,
      pdfFileName: true,
      transcriptionStatus: true,
      videoSummary: true,
      attachments: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          fileKey: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          position: true,
        },
      },
      lessonProgress: {
        where: {
          userId: session.id,
        },
        select: {
          completed: true,
          lessonId: true,
          lastWatchedPosition: true,
          watchedDuration: true,
          watchPercentage: true,
        },
      },
      Chapter: {
        select: {
          courseId: true,
          title: true,
          Course: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      quiz: {
        where: {
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          timeLimit: true,
          passingScore: true,
          questions: {
            select: {
              id: true,
              question: true,
              position: true,
              points: true,
              createdAt: true,
              updatedAt: true,
              quizId: true,
              // Never send isCorrect to the client; answers are graded on the server.
              options: {
                select: {
                  id: true,
                  text: true,
                  position: true,
                  createdAt: true,
                  updatedAt: true,
                  questionId: true,
                },
                orderBy: {
                  position: "asc",
                },
              },
            },
            orderBy: {
              position: "asc",
            },
          },
          attempts: {
            where: {
              userId: session.id,
            },
            orderBy: {
              startedAt: "desc",
            },
            select: {
              id: true,
              score: true,
              timeSpent: true,
              startedAt: true,
              submittedAt: true,
              isCompleted: true,
              tabSwitchCount: true,
              backButtonCount: true,
              windowBlurCount: true,
              visibilityChangeCount: true,
              copyAttemptCount: true,
              pasteAttemptCount: true,
              rightClickCount: true,
              devToolsAttemptCount: true,
            },
          },
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxScore: true,
          allowFile: true,
          allowText: true,
          autoGradeEnabled: true,
          allowedFileTypes: true,
          maxFileSizeBytes: true,
          submissions: {
            where: { userId: session.id },
            select: {
              id: true,
              fileKey: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              textAnswer: true,
              submittedAt: true,
              status: true,
              score: true,
              feedback: true,
              gradedAt: true,
              gradingMethod: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.id,
        courseId: lesson.Chapter.courseId,
      },
    },
    select: {
      status: true,
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return notFound();
  }
  return lesson;
});

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
