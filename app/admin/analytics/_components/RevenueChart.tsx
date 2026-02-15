"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
    data: { date: string; revenue: number; enrollments: number }[];
}

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

export function RevenueChart({ data }: RevenueChartProps) {
    const formattedData = data.map((item) => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
    }));

    const maxRevenueCents = Math.max(...data.map((d) => d.revenue), 0);
    const yDomain: [number, number] = [0, maxRevenueCents * 1.15 || 100];

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue for the last 30 days (from enrollments)</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 pr-4 pb-4">
                <div className="h-[320px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={formattedData}
                            margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={24}
                            />
                            <YAxis
                                tickFormatter={(value) => formatCurrency(value)}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={52}
                                domain={yDomain}
                                tickCount={6}
                            />
                            <Tooltip
                                formatter={(value: number) => [
                                    value === 0 ? "No revenue" : formatCurrency(value),
                                    "Revenue",
                                ]}
                                labelFormatter={(label) => label}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                strokeWidth={2}
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
