import { DollarSign, Minus, Receipt, ShoppingCart, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { StatCard, StatGrid, type StatTone } from "@/app/admin/_components/StatCard";
import { formatCents, formatNumber } from "@/app/admin/_lib/format";
import type { RevenueStats } from "@/app/data/admin/admin-get-revenue-stats";
import { cn } from "@/lib/utils";

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

interface Trend {
  icon: LucideIcon;
  text: string;
  direction: "up" | "down" | "flat";
}

/** Compares the last 30 days with the 30 days before; the wording carries the meaning, not the colour. */
function getTrend(current: number, previous: number, growth: number): Trend {
  if (previous === 0) {
    return current > 0
      ? { icon: TrendingUp, text: "No sales in the prior 30 days", direction: "up" }
      : { icon: Minus, text: "No sales in the last 60 days", direction: "flat" };
  }
  const rounded = Math.round(growth * 10) / 10;
  if (rounded === 0) {
    return { icon: Minus, text: "No change vs prior 30 days", direction: "flat" };
  }
  return {
    icon: rounded > 0 ? TrendingUp : TrendingDown,
    text: `${percentFormatter.format(rounded)}% vs prior 30 days`,
    direction: rounded > 0 ? "up" : "down",
  };
}

const trendClasses: Record<Trend["direction"], string> = {
  up: "text-emerald-700 dark:text-emerald-400",
  down: "text-red-700 dark:text-red-400",
  flat: "text-muted-foreground",
};

const trendTones: Record<Trend["direction"], StatTone> = {
  up: "success",
  down: "danger",
  flat: "default",
};

export function RevenueCards({ stats }: { stats: RevenueStats }) {
  const trend = getTrend(stats.thisMonthRevenue, stats.lastMonthRevenue, stats.revenueGrowth);
  const TrendIcon = trend.icon;

  return (
    <StatGrid columns={4}>
      <StatCard
        label="Total revenue"
        value={formatCents(stats.totalRevenue)}
        icon={DollarSign}
        description="Lifetime, from active enrollments"
      />
      <StatCard
        label="Last 30 days"
        value={formatCents(stats.thisMonthRevenue)}
        icon={TrendIcon}
        tone={trendTones[trend.direction]}
        description={
          <span className={cn("inline-flex items-center gap-1 font-medium", trendClasses[trend.direction])}>
            <TrendIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {trend.text}
          </span>
        }
      />
      <StatCard
        label="Total enrollments"
        value={formatNumber(stats.totalEnrollments)}
        icon={ShoppingCart}
        description={`${formatNumber(stats.activeEnrollments)} active`}
      />
      <StatCard
        label="Avg. order value"
        value={formatCents(stats.averageOrderValue)}
        icon={Receipt}
        description="Per active enrollment"
      />
    </StatGrid>
  );
}
