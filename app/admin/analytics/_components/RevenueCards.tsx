"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    IconCurrencyDollar,
    IconTrendingUp,
    IconTrendingDown,
    IconShoppingCart,
    IconReceipt,
} from "@tabler/icons-react";
import type { RevenueStats } from "@/app/data/admin/admin-get-revenue-stats";

interface RevenueCardsProps {
    stats: RevenueStats;
}

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(cents / 100);
}

export function RevenueCards({ stats }: RevenueCardsProps) {
    const isPositiveGrowth = stats.revenueGrowth >= 0;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription>Total Revenue</CardDescription>
                    <IconCurrencyDollar className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-2xl font-bold">
                        {formatCurrency(stats.totalRevenue)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Lifetime earnings from all enrollments
                    </p>
                </CardContent>
            </Card>

            {/* This Month Revenue */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription>This Month</CardDescription>
                    {isPositiveGrowth ? (
                        <IconTrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                        <IconTrendingDown className="h-5 w-5 text-red-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-2xl font-bold">
                        {formatCurrency(stats.thisMonthRevenue)}
                    </CardTitle>
                    <p className={`text-xs mt-1 ${isPositiveGrowth ? "text-green-600" : "text-red-600"}`}>
                        {isPositiveGrowth ? "+" : ""}{stats.revenueGrowth.toFixed(1)}% from last month
                    </p>
                </CardContent>
            </Card>

            {/* Total Enrollments */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription>Total Enrollments</CardDescription>
                    <IconShoppingCart className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-2xl font-bold">
                        {stats.totalEnrollments}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.activeEnrollments} active enrollments
                    </p>
                </CardContent>
            </Card>

            {/* Average Order Value */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription>Avg. Order Value</CardDescription>
                    <IconReceipt className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-2xl font-bold">
                        {formatCurrency(stats.averageOrderValue)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Per enrollment average
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
