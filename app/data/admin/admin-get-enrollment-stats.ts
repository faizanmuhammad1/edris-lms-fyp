import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

/**
 * New enrollments (all statuses) per day for the last 30 days, zero-filled.
 * Days are keyed as UTC `yyyy-mm-dd`; an empty platform returns 30 zero days.
 */
export async function adminGetEnrollmentStats(): Promise<{ date: string; enrollments: number }[]> {
  await requireAdmin();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const enrollments = await prisma.enrollment.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const enrollment of enrollments) {
    const day = enrollment.createdAt.toISOString().split("T")[0];
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const last30Days: { date: string; enrollments: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const day = date.toISOString().split("T")[0];
    last30Days.push({ date: day, enrollments: counts.get(day) ?? 0 });
  }

  return last30Days;
}
