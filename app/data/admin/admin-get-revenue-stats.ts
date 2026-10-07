import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

/**
 * Platform revenue figures. Every money field is in CENTS (`Enrollment.amount`);
 * format with `formatCents` from app/admin/_lib/format.
 */
export interface RevenueStats {
    /** Lifetime revenue from active enrollments (cents). */
    totalRevenue: number;
    /** Revenue from active enrollments in the last 30 days (cents). */
    thisMonthRevenue: number;
    /** Revenue from active enrollments 30–60 days ago (cents). */
    lastMonthRevenue: number;
    /**
     * % change of the last 30 days vs the 30 days before, rounded to 2 decimals.
     * 100 when there was no revenue to compare against; check `lastMonthRevenue`.
     */
    revenueGrowth: number;
    /** Enrollments of every status. */
    totalEnrollments: number;
    activeEnrollments: number;
    /** Average active enrollment amount (cents). */
    averageOrderValue: number;
    /** Last 30 days (oldest first), keyed by UTC `yyyy-mm-dd`; revenue in cents. */
    revenueByDay: { date: string; revenue: number; enrollments: number }[];
}

export async function adminGetRevenueStats(): Promise<RevenueStats> {
    await requireAdmin();

    const now = new Date();

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // Aggregate in the database; only the last 30 days are loaded row by row (for the chart).
    const [totalEnrollments, lifetime, previousPeriod, recentEnrollments] = await Promise.all([
        prisma.enrollment.count(),
        prisma.enrollment.aggregate({
            where: { status: "Active" },
            _sum: { amount: true },
            _count: true,
        }),
        prisma.enrollment.aggregate({
            where: {
                status: "Active",
                createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
            },
            _sum: { amount: true },
        }),
        prisma.enrollment.findMany({
            where: { status: "Active", createdAt: { gte: thirtyDaysAgo } },
            select: { amount: true, createdAt: true },
        }),
    ]);

    const totalRevenue = lifetime._sum.amount ?? 0;
    const activeEnrollments = lifetime._count;
    const averageOrderValue = activeEnrollments > 0 ? Math.round(totalRevenue / activeEnrollments) : 0;

    const thisMonthRevenue = recentEnrollments.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthRevenue = previousPeriod._sum.amount ?? 0;

    const revenueGrowth =
        lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : thisMonthRevenue > 0
              ? 100
              : 0;

    const dayMap = new Map<string, { revenue: number; enrollments: number }>();
    for (const enrollment of recentEnrollments) {
        const day = enrollment.createdAt.toISOString().split("T")[0];
        const existing = dayMap.get(day);
        if (existing) {
            existing.revenue += enrollment.amount;
            existing.enrollments += 1;
        } else {
            dayMap.set(day, { revenue: enrollment.amount, enrollments: 1 });
        }
    }

    const revenueByDay: RevenueStats["revenueByDay"] = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const day = date.toISOString().split("T")[0];
        const dayData = dayMap.get(day);
        revenueByDay.push({
            date: day,
            revenue: dayData?.revenue ?? 0,
            enrollments: dayData?.enrollments ?? 0,
        });
    }

    return {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalEnrollments,
        activeEnrollments,
        averageOrderValue,
        revenueByDay,
    };
}
