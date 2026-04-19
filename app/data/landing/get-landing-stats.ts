import { prisma } from "@/lib/db";

export type LandingStats = {
  totalStudents: number;
  totalCourses: number;
  totalCertificates: number;
  averageRating: number;
  categoryCounts: Record<string, number>;
  instructorStats: {
    name: string;
    totalStudents: number;
    totalCourses: number;
  }[];
  courseStats: Record<
    string,
    {
      enrollmentCount: number;
      averageRating: number;
      reviewCount: number;
    }
  >;
};

export async function getLandingStats(): Promise<LandingStats> {
  const [
    totalStudents,
    totalCourses,
    totalCertificates,
    avgRatingResult,
    categoryCounts,
    courseStatsRaw,
  ] = await Promise.all([
    // Total unique students (users with at least one active enrollment)
    prisma.enrollment.findMany({
      where: { status: "Active" },
      select: { userId: true },
      distinct: ["userId"],
    }),

    // Total published courses
    prisma.course.count({
      where: { status: "Published" },
    }),

    // Total certificates issued
    prisma.certificate.count(),

    // Average rating across all reviews
    prisma.review.aggregate({
      _avg: { rating: true },
    }),

    // Course counts per category
    prisma.course.groupBy({
      by: ["category"],
      where: { status: "Published" },
      _count: { id: true },
    }),

    // Per-course stats: enrollment count + review stats
    prisma.course.findMany({
      where: { status: "Published" },
      select: {
        id: true,
        userId: true,
        _count: {
          select: {
            enrollment: {
              where: { status: "Active" },
            },
            reviews: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
    }),
  ]);

  // Build category counts map
  const categoryCountsMap: Record<string, number> = {};
  for (const cat of categoryCounts) {
    categoryCountsMap[cat.category] = cat._count.id;
  }

  // Build per-course stats map
  const courseStats: LandingStats["courseStats"] = {};
  for (const course of courseStatsRaw) {
    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
          course.reviews.length
        : 0;

    courseStats[course.id] = {
      enrollmentCount: course._count.enrollment,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: course._count.reviews,
    };
  }

  // Build instructor stats (group by userId)
  const instructorMap = new Map<
    string,
    { name: string; totalStudents: Set<string>; totalCourses: number }
  >();

  // Get instructor names
  const instructorIds = [...new Set(courseStatsRaw.map((c) => c.userId))];
  const instructors = await prisma.user.findMany({
    where: { id: { in: instructorIds } },
    select: { id: true, name: true },
  });
  const instructorNameMap = new Map(instructors.map((i) => [i.id, i.name]));

  // Get enrollments per course for instructor student counting
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "Active",
      courseId: { in: courseStatsRaw.map((c) => c.id) },
    },
    select: { userId: true, courseId: true },
  });

  // Map courseId to userId (instructor)
  const courseInstructorMap = new Map(
    courseStatsRaw.map((c) => [c.id, c.userId])
  );

  for (const course of courseStatsRaw) {
    const existing = instructorMap.get(course.userId);
    if (existing) {
      existing.totalCourses++;
    } else {
      instructorMap.set(course.userId, {
        name: instructorNameMap.get(course.userId) || "Instructor",
        totalStudents: new Set(),
        totalCourses: 1,
      });
    }
  }

  for (const enrollment of enrollments) {
    const instructorId = courseInstructorMap.get(enrollment.courseId);
    if (instructorId) {
      const stat = instructorMap.get(instructorId);
      if (stat) {
        stat.totalStudents.add(enrollment.userId);
      }
    }
  }

  const instructorStats = Array.from(instructorMap.values()).map((stat) => ({
    name: stat.name,
    totalStudents: stat.totalStudents.size,
    totalCourses: stat.totalCourses,
  }));

  return {
    totalStudents: totalStudents.length,
    totalCourses,
    totalCertificates,
    averageRating: avgRatingResult._avg.rating ?? 0,
    categoryCounts: categoryCountsMap,
    courseStats,
    instructorStats,
  };
}
