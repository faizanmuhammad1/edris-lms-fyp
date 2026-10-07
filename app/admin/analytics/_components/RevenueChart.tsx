"use client";

import { format, parseISO } from "date-fns";
import { ChartArea } from "lucide-react";
import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/general/EmptyState";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCents, formatCentsCompact, formatNumber, pluralize } from "@/app/admin/_lib/format";

interface RevenueChartProps {
  /** One entry per day, oldest first; `date` is `yyyy-mm-dd`, `revenue` is in cents. */
  data: { date: string; revenue: number; enrollments: number }[];
}

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** `yyyy-mm-dd` is parsed as a local calendar day, so labels never shift by timezone. */
function formatDay(date: string, pattern = "MMM d") {
  return format(parseISO(date), pattern);
}

export function RevenueChart({ data }: RevenueChartProps) {
  const gradientId = `revenue-fill-${useId().replace(/:/g, "")}`;

  const summary = useMemo(() => {
    let total = 0;
    let enrollments = 0;
    let peak: RevenueChartProps["data"][number] | undefined;
    for (const day of data) {
      total += day.revenue;
      enrollments += day.enrollments;
      if (!peak || day.revenue > peak.revenue) peak = day;
    }
    return { total, enrollments, peak };
  }, [data]);

  const { total, enrollments, peak } = summary;

  if (total === 0 || !peak) {
    return (
      <EmptyState
        titleAs="h3"
        icon={ChartArea}
        title="No revenue in the last 30 days"
        description="Daily revenue will be charted here as soon as students purchase courses."
      />
    );
  }

  const peakDay = formatDay(peak.date);
  const chartLabel = `Area chart of daily revenue over the last 30 days. Total ${formatCents(total)} from ${pluralize(
    enrollments,
    "enrollment"
  )}; peak ${formatCents(peak.revenue)} on ${formatDay(peak.date, "MMMM d")}.`;

  return (
    <Card className="min-w-0 gap-4 py-4 sm:py-6">
      <CardHeader className="px-4 sm:px-6">
        <h3 className="leading-none font-semibold">Revenue over time</h3>
        <CardDescription>Daily revenue from active enrollments, last 30 days</CardDescription>
        <dl className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-medium tabular-nums">{formatCents(total)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Peak day</dt>
            <dd className="font-medium tabular-nums">
              {formatCents(peak.revenue)} on {peakDay}
            </dd>
          </div>
        </dl>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div role="img" aria-label={chartLabel}>
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full sm:h-[300px]">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatDay(String(value))}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickCount={5}
                allowDecimals={false}
                tickFormatter={(value) => formatCentsCompact(Number(value))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="min-w-40"
                    labelFormatter={(value) => formatDay(String(value), "EEE, MMM d")}
                    formatter={(value, _name, item) => (
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2.5 shrink-0 rounded-[2px] bg-(--color-revenue)" aria-hidden="true" />
                            Revenue
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatCents(Number(value))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-muted-foreground">
                          <span className="pl-4">Enrollments</span>
                          <span className="font-mono tabular-nums">
                            {formatNumber(Number(item.payload?.enrollments ?? 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="monotone"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
