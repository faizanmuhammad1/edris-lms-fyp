"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryDatum } from "./CategoryChart";

export function CategoryPie({ data }: { data: CategoryDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="category"
          innerRadius={50}
          outerRadius={72}
          paddingAngle={data.length > 1 ? 4 : 0}
          strokeWidth={0}
          isAnimationActive={false}
        >
          {data.map((entry) => (
            <Cell key={entry.category} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload && payload.length ? (
              <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-sm text-popover-foreground shadow-md">
                {payload[0].name}: {payload[0].value}
              </div>
            ) : null
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
