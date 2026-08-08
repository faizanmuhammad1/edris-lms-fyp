import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export interface TeacherPerformanceRow {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  totalRevenue: number;
  enrollmentCount: number;
  courseCount: number;
  topCourseTitle: string;
  topCourseRevenue: number;
  topCourseEnrollments: number;
}

export interface TopCourseRow {
  courseId: string;
  courseTitle: string;
  teacherName: string;
  teacherEmail: string;
  revenue: number;
  enrollmentCount: number;
}

export interface ExtendedAnalytics {
  teachersPerformance: TeacherPerformanceRow[];
  topCoursesByRevenue: TopCourseRow[];
  topCoursesByEnrollments: TopCourseRow[];
  totalTeachers: number;
  totalCourses: number;
  publishedCourses: number;
  newEnrollmentsThisWeek: number;
  revenueThisWeek: number;
}

export async function adminGetAnalyticsExtended(): Promise<ExtendedAnalytics> {
  await requireAdmin();

  const [
    activeEnrollments,
    totalTeachers,
    totalCourses,
    publishedCourses,
    weekAgo,
  ] = await Promise.all([
    prisma.enrollment.findMany({
      where: { status: "Active" },
      select: {
        amount: true,
        createdAt: true,
        courseId: true,
        Course: {
          select: {
            id: true,
            title: true,
            userId: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        OR: [{ role: "teacher" }, { teacherStatus: "Approved" }],
      },
    }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "Published" } }),
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    })(),
  ]);

  const newEnrollmentsThisWeek = activeEnrollments.filter(
    (e) => e.createdAt >= weekAgo
  ).length;
  const revenueThisWeek = activeEnrollments
    .filter((e) => e.createdAt >= weekAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  // Per-course aggregates
  const byCourse = new Map<
    string,
    { title: string; teacherId: string; teacherName: string; teacherEmail: string; revenue: number; count: number }
  >();
  for (const e of activeEnrollments) {
    const c = e.Course;
    const existing = byCourse.get(e.courseId);
    if (existing) {
      existing.revenue += e.amount;
      existing.count += 1;
    } else {
      byCourse.set(e.courseId, {
        title: c.title,
        teacherId: c.userId,
        teacherName: c.user.name,
        teacherEmail: c.user.email,
        revenue: e.amount,
        count: 1,
      });
    }
  }

  const courseRows: TopCourseRow[] = Array.from(byCourse.entries()).map(
    ([courseId, v]) => ({
      courseId,
      courseTitle: v.title,
      teacherName: v.teacherName,
      teacherEmail: v.teacherEmail,
      revenue: v.revenue,
      enrollmentCount: v.count,
    })
  );

  const topCoursesByRevenue = [...courseRows].sort(
    (a, b) => b.revenue - a.revenue
  );
  const topCoursesByEnrollments = [...courseRows].sort(
    (a, b) => b.enrollmentCount - a.enrollmentCount
  );

  // Per-teacher aggregates
  const byTeacher = new Map<
    string,
    {
      name: string;
      email: string;
      revenue: number;
      count: number;
      courses: Map<string, { title: string; revenue: number; count: number }>;
    }
  >();
  for (const e of activeEnrollments) {
    const c = e.Course;
    const tid = c.userId;
    let t = byTeacher.get(tid);
    if (!t) {
      t = {
        name: c.user.name,
        email: c.user.email,
        revenue: 0,
        count: 0,
        courses: new Map(),
      };
      byTeacher.set(tid, t);
    }
    t.revenue += e.amount;
    t.count += 1;
    const courseEntry = t.courses.get(e.courseId);
    if (courseEntry) {
      courseEntry.revenue += e.amount;
      courseEntry.count += 1;
    } else {
      t.courses.set(e.courseId, {
        title: c.title,
        revenue: e.amount,
        count: 1,
      });
    }
  }

  const teachersPerformance: TeacherPerformanceRow[] = Array.from(
    byTeacher.entries()
  ).map(([teacherId, t]) => {
    const courseList = Array.from(t.courses.values());
    const top = courseList.sort((a, b) => b.revenue - a.revenue)[0];
    return {
      teacherId,
      teacherName: t.name,
      teacherEmail: t.email,
      totalRevenue: t.revenue,
      enrollmentCount: t.count,
      courseCount: t.courses.size,
      topCourseTitle: top?.title ?? "—",
      topCourseRevenue: top?.revenue ?? 0,
      topCourseEnrollments: top?.count ?? 0,
    };
  });

  teachersPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    teachersPerformance,
    topCoursesByRevenue: topCoursesByRevenue.slice(0, 15),
    topCoursesByEnrollments: topCoursesByEnrollments.slice(0, 15),
    totalTeachers,
    totalCourses,
    publishedCourses,
    newEnrollmentsThisWeek,
    revenueThisWeek,
  };
}
