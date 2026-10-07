"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatDay(value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  // Dates are yyyy-mm-dd (UTC); format in UTC so the label matches the bucket.
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

interface ChartAreaInteractiveProps {
  data: { date: string; enrollments: number }[];
  title?: string;
}

/** Daily enrollments bar chart with a text summary for screen readers. */
export function ChartAreaInteractive({ data, title = "New enrollments" }: ChartAreaInteractiveProps) {
  const { total, peak } = React.useMemo(() => {
    let sum = 0;
    let best: { date: string; enrollments: number } | null = null;
    for (const day of data) {
      sum += day.enrollments;
      if (!best || day.enrollments > best.enrollments) best = day;
    }
    return { total: sum, peak: best };
  }, [data]);

  const summary =
    total === 0
      ? `No enrollments in the last ${data.length} days.`
      : `${total.toLocaleString("en-US")} enrollments in the last ${data.length} days` +
        (peak ? `, peaking at ${peak.enrollments.toLocaleString("en-US")} on ${formatDay(peak.date)}.` : ".");

  return (
    <Card className="@container/card min-w-0 gap-4">
      <CardHeader>
        <CardTitle className="text-base">
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>
          Last {data.length} days · {total.toLocaleString("en-US")} total
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {total === 0 ? (
          <p className="flex h-[200px] items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground sm:h-[250px]">
            No enrollments in this period yet.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[200px] w-full sm:h-[250px]"
            role="img"
            aria-label={summary}
          >
            <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                interval="preserveStartEnd"
                tickFormatter={(value: string) => formatDay(value)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
                tickMargin={4}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-[160px]"
                    labelFormatter={(value: string) =>
                      formatDay(value, { weekday: "short", month: "short", day: "numeric" })
                    }
                  />
                }
              />
              <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
