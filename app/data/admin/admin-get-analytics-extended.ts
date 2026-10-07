import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

/** Money fields are in CENTS (`Enrollment.amount`); format with `formatCents`. */
export interface TeacherPerformanceRow {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  totalRevenue: number;
  enrollmentCount: number;
  /** Courses of this teacher with at least one active enrollment. */
  courseCount: number;
  topCourseTitle: string;
  topCourseRevenue: number;
  topCourseEnrollments: number;
}

/** `revenue` is in CENTS. */
export interface TopCourseRow {
  courseId: string;
  courseTitle: string;
  teacherName: string;
  teacherEmail: string;
  revenue: number;
  enrollmentCount: number;
}

export interface ExtendedAnalytics {
  /** Sorted by revenue, highest first. */
  teachersPerformance: TeacherPerformanceRow[];
  /** Top 15 by revenue. */
  topCoursesByRevenue: TopCourseRow[];
  /** Top 15 by active enrollments. */
  topCoursesByEnrollments: TopCourseRow[];
  totalTeachers: number;
  totalCourses: number;
  publishedCourses: number;
  /** Active enrollments since midnight 7 days ago. */
  newEnrollmentsThisWeek: number;
  /** Revenue of those enrollments (cents). */
  revenueThisWeek: number;
}

const TOP_COURSES_LIMIT = 15;

export async function adminGetAnalyticsExtended(): Promise<ExtendedAnalytics> {
  await requireAdmin();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  // Aggregate per course in the database instead of loading every enrollment.
  const [courseTotals, thisWeek, totalTeachers, totalCourses, publishedCourses] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: { status: "Active" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.enrollment.aggregate({
      where: { status: "Active", createdAt: { gte: weekAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.user.count({
      where: {
        OR: [{ role: "teacher" }, { teacherStatus: "Approved" }],
      },
    }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "Published" } }),
  ]);

  const courses =
    courseTotals.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseTotals.map((c) => c.courseId) } },
          select: {
            id: true,
            title: true,
            userId: true,
            user: { select: { name: true, email: true } },
          },
        })
      : [];
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const courseRows: TopCourseRow[] = [];
  const teacherIdByCourse = new Map<string, string>();
  for (const total of courseTotals) {
    const course = courseById.get(total.courseId);
    if (!course) continue;
    teacherIdByCourse.set(course.id, course.userId);
    courseRows.push({
      courseId: course.id,
      courseTitle: course.title,
      teacherName: course.user.name,
      teacherEmail: course.user.email,
      revenue: total._sum.amount ?? 0,
      enrollmentCount: total._count._all,
    });
  }

  const topCoursesByRevenue = [...courseRows]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_COURSES_LIMIT);
  const topCoursesByEnrollments = [...courseRows]
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, TOP_COURSES_LIMIT);

  // Per-teacher aggregates, built from the per-course totals.
  const byTeacher = new Map<string, TeacherPerformanceRow>();
  for (const course of courseRows) {
    const teacherId = teacherIdByCourse.get(course.courseId)!;
    const existing = byTeacher.get(teacherId);
    if (!existing) {
      byTeacher.set(teacherId, {
        teacherId,
        teacherName: course.teacherName,
        teacherEmail: course.teacherEmail,
        totalRevenue: course.revenue,
        enrollmentCount: course.enrollmentCount,
        courseCount: 1,
        topCourseTitle: course.courseTitle,
        topCourseRevenue: course.revenue,
        topCourseEnrollments: course.enrollmentCount,
      });
      continue;
    }
    existing.totalRevenue += course.revenue;
    existing.enrollmentCount += course.enrollmentCount;
    existing.courseCount += 1;
    if (course.revenue > existing.topCourseRevenue) {
      existing.topCourseTitle = course.courseTitle;
      existing.topCourseRevenue = course.revenue;
      existing.topCourseEnrollments = course.enrollmentCount;
    }
  }

  const teachersPerformance = Array.from(byTeacher.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    teachersPerformance,
    topCoursesByRevenue,
    topCoursesByEnrollments,
    totalTeachers,
    totalCourses,
    publishedCourses,
    newEnrollmentsThisWeek: thisWeek._count,
    revenueThisWeek: thisWeek._sum.amount ?? 0,
  };
}
