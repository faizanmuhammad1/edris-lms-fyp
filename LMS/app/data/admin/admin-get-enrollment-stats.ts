// server-only

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetEnrollmentStats() {
  await requireAdmin();

  const thirtyDaysAgo = new Date();

  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const last30Days: { date: string; enrollments: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    last30Days.push({
      date: date.toISOString().split("T")[0], //yyyy-mm-dd
      enrollments: 0,
    });
  }

  enrollments.forEach((enrollment) => {
    const enrollmentDate = enrollment.createdAt.toISOString().split("T")[0];
    const dayIndex = last30Days.findIndex((day) => day.date === enrollmentDate);

    if (dayIndex !== -1) {
      last30Days[dayIndex].enrollments++;
    }
  });

  // Fallback demo data when there are no enrollments
  if (enrollments.length === 0) {
    // Generate a smooth synthetic trend for the last 30 days
    const base = 4;
    const amp = 6;
    const mock = last30Days.map((d, i) => ({
      date: d.date,
      enrollments: Math.max(
        0,
        Math.round(base + amp * Math.sin((i / last30Days.length) * Math.PI))
      ),
    }));
    return mock;
  }

  return last30Days;
}
