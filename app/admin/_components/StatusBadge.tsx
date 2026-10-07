import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const toneClasses: Record<BadgeTone, string> = {
  success: "border-emerald-600/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  warning: "border-amber-600/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  danger: "border-red-600/25 bg-red-500/10 text-red-800 dark:text-red-300",
  info: "border-sky-600/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  accent: "border-violet-600/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  neutral: "border-border bg-muted text-muted-foreground",
};

const dotClasses: Record<BadgeTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  accent: "bg-violet-500",
  neutral: "bg-muted-foreground/60",
};

/**
 * Text status pill with a tone. The label always carries the meaning; colour is
 * only reinforcement (WCAG 1.4.1).
 */
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", toneClasses[tone], className)}>
      <span className={cn("size-1.5 rounded-full", dotClasses[tone])} aria-hidden="true" />
      {children}
    </Badge>
  );
}

/** Course status -> badge. */
export function CourseStatusBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    status === "Published" ? "success" : status === "Archived" ? "neutral" : status === "Draft" ? "warning" : "info";
  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}
