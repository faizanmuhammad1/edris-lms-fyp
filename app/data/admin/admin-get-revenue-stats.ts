import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export interface RevenueStats {
    totalRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
    totalEnrollments: number;
    activeEnrollments: number;
    averageOrderValue: number;
    revenueByDay: { date: string; revenue: number; enrollments: number }[];
}

export async function adminGetRevenueStats(): Promise<RevenueStats> {
    await requireAdmin();

    const now = new Date();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // Run all aggregations in parallel at database level
    const [
        totalEnrollmentsCount,
        activeEnrollments,
        thisMonthEnrollments,
        lastMonthEnrollments,
    ] = await Promise.all([
        // Total enrollments (all statuses)
        prisma.enrollment.count(),

        // Active enrollments with amounts (for total revenue + daily breakdown)
        prisma.enrollment.findMany({
            where: { status: "Active" },
            select: {
                amount: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        }),

        // This month's active revenue (last 30 days) -- aggregated at DB level
        prisma.enrollment.aggregate({
            where: {
                status: "Active",
                createdAt: { gte: thirtyDaysAgo },
            },
            _sum: { amount: true },
            _count: true,
        }),

        // Last month's active revenue (30-60 days ago) -- aggregated at DB level
        prisma.enrollment.aggregate({
            where: {
                status: "Active",
                createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
            },
            _sum: { amount: true },
            _count: true,
        }),
    ]);

    // Calculate totals
    const totalRevenue = activeEnrollments.reduce((sum, e) => sum + e.amount, 0);
    const averageOrderValue = activeEnrollments.length > 0
        ? Math.round(totalRevenue / activeEnrollments.length)
        : 0;

    const thisMonthRevenue = thisMonthEnrollments._sum.amount ?? 0;
    const lastMonthRevenue = lastMonthEnrollments._sum.amount ?? 0;

    // Revenue growth percentage
    const revenueGrowth = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0 ? 100 : 0;

    // Revenue by day for the last 30 days -- build a map for O(1) lookups
    const dayMap = new Map<string, { revenue: number; enrollments: number }>();
    for (const enrollment of activeEnrollments) {
        const dateStr = enrollment.createdAt.toISOString().split("T")[0];
        const existing = dayMap.get(dateStr);
        if (existing) {
            existing.revenue += enrollment.amount;
            existing.enrollments += 1;
        } else {
            dayMap.set(dateStr, { revenue: enrollment.amount, enrollments: 1 });
        }
    }

    const revenueByDay: { date: string; revenue: number; enrollments: number }[] = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayData = dayMap.get(dateStr);

        revenueByDay.push({
            date: dateStr,
            revenue: dayData?.revenue ?? 0,
            enrollments: dayData?.enrollments ?? 0,
        });
    }

    return {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalEnrollments: totalEnrollmentsCount,
        activeEnrollments: activeEnrollments.length,
        averageOrderValue,
        revenueByDay,
    };
}
