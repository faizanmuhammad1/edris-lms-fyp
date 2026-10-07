import "server-only";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

export async function getQuizForWindow(lessonId: string) {
  const session = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      Chapter: {
        select: {
          courseId: true,
          Course: {
            select: {
              slug: true,
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
        },
      },
    },
  });

  if (!lesson || !lesson.quiz) {
    return null;
  }

  // Check if lesson is completed
  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.id,
        lessonId: lesson.id,
      },
    },
    select: {
      completed: true,
    },
  });

  if (!progress || !progress.completed) {
    return null;
  }

  // Check enrollment
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
    return null;
  }

  return {
    quiz: lesson.quiz,
    courseSlug: lesson.Chapter.Course.slug,
  };
}
