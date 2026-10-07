import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTone = "default" | "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const toneIconClasses: Record<StatTone, string> = {
  default: "bg-primary/10 text-primary",
  accent: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  neutral: "bg-muted text-muted-foreground",
};

interface StatCardProps {
  label: string;
  /** Already-formatted value (use the helpers in app/admin/_lib/format). */
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** Supporting text under the value; keep meaning in the words, not the colour. */
  description?: ReactNode;
  tone?: StatTone;
  /** Makes the whole card a link (e.g. to the filtered list). */
  href?: string;
  className?: string;
}

/** KPI tile used across admin pages: same size, tabular numbers, text-first trends. */
export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  tone = "default",
  href,
  className,
}: StatCardProps) {
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums break-words">{value}</p>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      {Icon && (
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", toneIconClasses[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  return (
    <Card
      className={cn(
        "h-full gap-0 p-4 shadow-xs sm:p-5",
        href && "transition-colors focus-within:ring-2 focus-within:ring-ring/50 hover:border-primary/40",
        className
      )}
    >
      {href ? (
        <Link href={href} className="rounded-md outline-none">
          {body}
        </Link>
      ) : (
        body
      )}
    </Card>
  );
}

/** Responsive grid for StatCards: 1 col on tiny phones, 2 on phones, up to `columns` on desktop. */
export function StatGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const lg: Record<number, string> = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-3 xl:grid-cols-5",
    6: "lg:grid-cols-3 xl:grid-cols-6",
  };
  return (
    <div className={cn("grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4", lg[columns], className)}>
      {children}
    </div>
  );
}
