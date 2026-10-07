"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useReducedMotion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  students: { label: "Active students", color: "var(--chart-1)" },
} satisfies ChartConfig;

const MAX_BARS = 8;

function shorten(label: string, max = 18) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/** Horizontal bars so long course titles stay readable on phones. */
export function EnrollmentsByCourseChart({ data }: { data: { title: string; students: number }[] }) {
  const reduceMotion = useReducedMotion();
  const rows = [...data]
    .sort((a, b) => b.students - a.students)
    .slice(0, MAX_BARS);

  const summary = rows.map((r) => `${r.title}: ${r.students}`).join("; ");
  const height = Math.max(160, rows.length * 44 + 40);

  return (
    <figure className="space-y-2">
      <div role="img" aria-label={`Active students per course. ${summary}`}>
        <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height }}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" dataKey="students" allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              type="category"
              dataKey="title"
              width={120}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={(value: string) => shorten(value)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="students" fill="var(--color-students)" radius={4} maxBarSize={28} isAnimationActive={!reduceMotion} />
          </BarChart>
        </ChartContainer>
      </div>
      {data.length > MAX_BARS && (
        <figcaption className="text-xs text-muted-foreground">
          Showing your top {MAX_BARS} courses. All courses are listed in the table below.
        </figcaption>
      )}
    </figure>
  );
}
