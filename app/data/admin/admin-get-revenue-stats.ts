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

    // Fallback demo data when there's no revenue
    if (totalRevenue === 0) {
        const mockRevenue: { date: string; revenue: number; enrollments: number }[] = [];
        const dailyPatterns = [
            0, 0, 4999, 0, 9999, 0, 0,
            0, 4999, 0, 0, 14999, 4999, 0,
            9999, 0, 0, 4999, 0, 0, 0,
            0, 4999, 9999, 0, 0, 4999, 0,
            14999, 4999,
        ];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const revenue = dailyPatterns[29 - i] || 0;
            mockRevenue.push({
                date: date.toISOString().split("T")[0],
                revenue,
                enrollments: revenue > 0 ? Math.ceil(revenue / 4999) : 0,
            });
        }

        const mockTotalRevenue = mockRevenue.reduce((sum, d) => sum + d.revenue, 0);
        const mockThisMonth = mockRevenue.slice(-15).reduce((sum, d) => sum + d.revenue, 0);
        const mockLastMonth = mockRevenue.slice(0, 15).reduce((sum, d) => sum + d.revenue, 0);

        return {
            totalRevenue: mockTotalRevenue,
            thisMonthRevenue: mockThisMonth,
            lastMonthRevenue: mockLastMonth,
            revenueGrowth: mockLastMonth > 0
                ? ((mockThisMonth - mockLastMonth) / mockLastMonth) * 100
                : 0,
            totalEnrollments: 12,
            activeEnrollments: 12,
            averageOrderValue: Math.round(mockTotalRevenue / 12),
            revenueByDay: mockRevenue,
        };
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
