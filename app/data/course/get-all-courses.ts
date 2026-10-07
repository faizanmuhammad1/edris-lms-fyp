import { prisma } from "@/lib/db";

/** Older links used display names that differ from the stored category values. */
const CATEGORY_ALIASES: Record<string, string> = {
  "Finance & Accounting": "Finance",
};

export async function getAllCourses(category?: string, search?: string) {
  const normalizedCategory = category ? CATEGORY_ALIASES[category] ?? category : undefined;
  const query = search?.trim().slice(0, 100);

  const data = await prisma.course.findMany({
    where: {
      status: "Published",
      ...(normalizedCategory && { category: normalizedCategory }),
      ...(query && {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { smallDescription: { contains: query, mode: "insensitive" as const } },
          { category: { contains: query, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      title: true,
      price: true,
      smallDescription: true,
      slug: true,
      fileKey: true,
      id: true,
      level: true,
      duration: true,
      category: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return data;
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];

export type CourseCardStats = {
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
};

/** Real enrollment and review stats for course cards, keyed by course id. */
export async function getCourseCardStats(
  courseIds: string[]
): Promise<Record<string, CourseCardStats>> {
  if (courseIds.length === 0) return {};

  const [reviews, enrollments] = await Promise.all([
    prisma.review.groupBy({
      by: ["courseId"],
      where: { courseId: { in: courseIds } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: { courseId: { in: courseIds }, status: "Active" },
      _count: { _all: true },
    }),
  ]);

  const stats: Record<string, CourseCardStats> = {};
  for (const id of courseIds) {
    stats[id] = { enrollmentCount: 0, averageRating: 0, reviewCount: 0 };
  }
  for (const r of reviews) {
    stats[r.courseId].averageRating = Math.round((r._avg.rating ?? 0) * 10) / 10;
    stats[r.courseId].reviewCount = r._count._all;
  }
  for (const e of enrollments) {
    stats[e.courseId].enrollmentCount = e._count._all;
  }
  return stats;
}
