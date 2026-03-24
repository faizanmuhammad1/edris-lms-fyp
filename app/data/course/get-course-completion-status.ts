import { prisma } from "@/lib/db";

export type CourseCompletionStatus = {
  isEligible: boolean;
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  remainingLessonTitles: string[];
  remainingQuizTitles: string[];
  remainingAssignmentTitles: string[];
};

/**
 * Completion rules for certificate eligibility:
 * - lesson is marked complete
 * - if lesson has a published quiz, learner must pass it
 * - if lesson has an assignment, learner must submit it
 */
export async function getCourseCompletionStatus(
  courseId: string,
  userId: string
): Promise<CourseCompletionStatus> {
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    orderBy: { position: "asc" },
    select: {
      lessons: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          lessonProgress: {
            where: { userId, completed: true },
            select: { id: true },
          },
          quiz: {
            select: {
              id: true,
              isPublished: true,
              passingScore: true,
              attempts: {
                where: { userId, isCompleted: true },
                select: { score: true },
              },
            },
          },
          assignment: {
            select: {
              id: true,
              submissions: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  const allLessons = chapters.flatMap((chapter) => chapter.lessons);
  const remainingLessonTitles: string[] = [];
  const remainingQuizTitles: string[] = [];
  const remainingAssignmentTitles: string[] = [];

  const completedLessons = allLessons.filter((lesson) => {
    const lessonMarkedComplete = lesson.lessonProgress.length > 0;

    const requiresQuiz = !!lesson.quiz && lesson.quiz.isPublished;
    const quizPassed =
      !requiresQuiz ||
      lesson.quiz!.attempts.some(
        (attempt) =>
          typeof attempt.score === "number" &&
          attempt.score >= lesson.quiz!.passingScore
      );

    const requiresAssignment = !!lesson.assignment;
    const assignmentSubmitted =
      !requiresAssignment || lesson.assignment!.submissions.length > 0;

    if (!lessonMarkedComplete) {
      remainingLessonTitles.push(lesson.title);
    }

    if (requiresQuiz && !quizPassed) {
      remainingQuizTitles.push(lesson.title);
    }

    if (requiresAssignment && !assignmentSubmitted) {
      remainingAssignmentTitles.push(lesson.title);
    }

    return lessonMarkedComplete && quizPassed && assignmentSubmitted;
  });

  const totalLessons = allLessons.length;
  const completedCount = completedLessons.length;
  const remainingLessons = Math.max(totalLessons - completedCount, 0);

  return {
    isEligible: totalLessons > 0 && remainingLessons === 0,
    totalLessons,
    completedLessons: completedCount,
    remainingLessons,
    remainingLessonTitles,
    remainingQuizTitles,
    remainingAssignmentTitles,
  };
}

