import { prisma } from "@/lib/db";

/**
 * True when every lesson in the course has lessonProgress.completed === true for this user.
 * Must match the logic in app/dashboard/certificate/[slug]/page.tsx getCertificateData.
 */
export async function isCourseFullyComplete(
  courseId: string,
  userId: string
): Promise<boolean> {
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    select: {
      lessons: {
        select: {
          id: true,
          lessonProgress: {
            where: { userId, completed: true },
            select: { id: true },
          },
        },
      },
    },
  });

  const allLessons = chapters.flatMap((ch) => ch.lessons);
  const completedLessons = allLessons.filter(
    (lesson) => lesson.lessonProgress.length > 0
  );

  return (
    allLessons.length > 0 && completedLessons.length === allLessons.length
  );
}
