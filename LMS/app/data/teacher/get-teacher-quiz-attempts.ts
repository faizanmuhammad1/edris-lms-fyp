"use server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export type ViolationLogEntry = { type: string; at: string };

export async function getTeacherQuizAttempts(options?: { courseId?: string }) {
  const session = await requireTeacher();
  const teacherId = session.user.id;

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      Quiz: {
        Lesson: {
          Chapter: {
            Course: {
              userId: teacherId,
              ...(options?.courseId ? { id: options.courseId } : {}),
            },
          },
        },
      },
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      Quiz: {
        include: {
          Lesson: {
            include: {
              Chapter: {
                include: {
                  Course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          questions: {
            include: {
              options: {
                orderBy: { position: "asc" },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      },
      answers: true,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  return attempts.map((attempt) => {
    const course = attempt.Quiz.Lesson.Chapter.Course;
    const lesson = attempt.Quiz.Lesson;
    const chapter = attempt.Quiz.Lesson.Chapter;
    const violationLog = attempt.violationLog as ViolationLogEntry[] | null | undefined;

    return {
      id: attempt.id,
      score: attempt.score ?? 0,
      timeSpent: attempt.timeSpent ?? 0,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      isCompleted: attempt.isCompleted,
      passed: attempt.score != null && attempt.score >= attempt.Quiz.passingScore,

      tabSwitchCount: attempt.tabSwitchCount,
      backButtonCount: attempt.backButtonCount,
      windowBlurCount: attempt.windowBlurCount,
      visibilityChangeCount: attempt.visibilityChangeCount,
      copyAttemptCount: attempt.copyAttemptCount,
      pasteAttemptCount: attempt.pasteAttemptCount,
      rightClickCount: attempt.rightClickCount,
      devToolsAttemptCount: attempt.devToolsAttemptCount,
      violationLog: Array.isArray(violationLog) ? violationLog : [],

      student: {
        id: attempt.User.id,
        name: attempt.User.name,
        email: attempt.User.email,
        image: attempt.User.image,
      },
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      lesson: {
        id: lesson.id,
        title: lesson.title,
      },
      chapter: {
        id: chapter.id,
        title: chapter.title,
      },
      quiz: {
        id: attempt.Quiz.id,
        title: attempt.Quiz.title,
        passingScore: attempt.Quiz.passingScore,
        questions: attempt.Quiz.questions,
      },
      answers: attempt.answers,
    };
  });
}

export type TeacherQuizAttemptItem = Awaited<
  ReturnType<typeof getTeacherQuizAttempts>
>[number];

export async function getTeacherQuizAttemptById(attemptId: string) {
  const session = await requireTeacher();
  const teacherId = session.user.id;

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      Quiz: {
        Lesson: {
          Chapter: {
            Course: {
              userId: teacherId,
            },
          },
        },
      },
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      Quiz: {
        include: {
          Lesson: {
            include: {
              Chapter: {
                include: {
                  Course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          questions: {
            include: {
              options: {
                orderBy: { position: "asc" },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) return null;

  const course = attempt.Quiz.Lesson.Chapter.Course;
  const lesson = attempt.Quiz.Lesson;
  const chapter = attempt.Quiz.Lesson.Chapter;
  const violationLog = attempt.violationLog as ViolationLogEntry[] | null | undefined;

  return {
    id: attempt.id,
    score: attempt.score ?? 0,
    timeSpent: attempt.timeSpent ?? 0,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    isCompleted: attempt.isCompleted,
    passed: attempt.score != null && attempt.score >= attempt.Quiz.passingScore,

    tabSwitchCount: attempt.tabSwitchCount,
    backButtonCount: attempt.backButtonCount,
    windowBlurCount: attempt.windowBlurCount,
    visibilityChangeCount: attempt.visibilityChangeCount,
    copyAttemptCount: attempt.copyAttemptCount,
    pasteAttemptCount: attempt.pasteAttemptCount,
    rightClickCount: attempt.rightClickCount,
    devToolsAttemptCount: attempt.devToolsAttemptCount,
    violationLog: Array.isArray(violationLog) ? violationLog : [],

    student: {
      id: attempt.User.id,
      name: attempt.User.name,
      email: attempt.User.email,
      image: attempt.User.image,
    },
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
    },
    lesson: {
      id: lesson.id,
      title: lesson.title,
    },
    chapter: {
      id: chapter.id,
      title: chapter.title,
    },
    quiz: {
      id: attempt.Quiz.id,
      title: attempt.Quiz.title,
      passingScore: attempt.Quiz.passingScore,
      questions: attempt.Quiz.questions,
    },
    answers: attempt.answers,
  };
}

export type TeacherQuizAttemptDetail = Awaited<
  ReturnType<typeof getTeacherQuizAttemptById>
>;
