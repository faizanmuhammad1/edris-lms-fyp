import { prisma } from "@/lib/db";

export type CourseCompletionStatus = {
  isEligible: boolean;
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  remainingLessonTitles: string[];
};

/**
 * Completion rules for certificate eligibility:
 * every lesson in the course must have lessonProgress.completed === true.
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
        },
      },
    },
  });

  const allLessons = chapters.flatMap((chapter) => chapter.lessons);
  const completedLessons = allLessons.filter(
    (lesson) => lesson.lessonProgress.length > 0
  );
  const remaining = allLessons.filter((lesson) => lesson.lessonProgress.length === 0);

  const totalLessons = allLessons.length;
  const completedCount = completedLessons.length;
  const remainingLessons = Math.max(totalLessons - completedCount, 0);

  return {
    isEligible: totalLessons > 0 && remainingLessons === 0,
    totalLessons,
    completedLessons: completedCount,
    remainingLessons,
    remainingLessonTitles: remaining.map((lesson) => lesson.title),
  };
}

