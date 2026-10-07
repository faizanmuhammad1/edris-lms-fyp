import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

/** Course + chapter/lesson outline for the admin course editor. */
export async function adminGetCourse(id: string) {
  await requireAdmin();

  const data = await prisma.course.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      fileKey: true,
      price: true,
      duration: true,
      level: true,
      status: true,
      slug: true,
      smallDescription: true,
      category: true,
      user: {
        select: { name: true },
      },
      chapter: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              videoKey: true,
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type AdminCourseSingularType = Awaited<
  ReturnType<typeof adminGetCourse>
>;

/**
 * What deleting a course removes, for the admin delete confirmation page.
 * Returns null when the course doesn't exist (e.g. it was just deleted), so the
 * page can say so instead of 404ing while the delete action revalidates it.
 */
export async function adminGetCourseDeleteSummary(id: string) {
  await requireAdmin();

  const [course, lessonCount] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        user: { select: { name: true } },
        _count: {
          select: {
            chapter: true,
            enrollment: true,
            reviews: true,
            certificates: true,
            communities: true,
          },
        },
      },
    }),
    prisma.lesson.count({ where: { Chapter: { courseId: id } } }),
  ]);

  if (!course) {
    return null;
  }

  return { ...course, lessonCount };
}
