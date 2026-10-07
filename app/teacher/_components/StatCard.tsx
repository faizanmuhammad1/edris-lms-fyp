import type { ComponentType, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

/** KPI tile: label, large value and a short explanation. */
export function StatCard({ label, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex h-full flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" aria-hidden="true" />
            </span>
          )}
        </div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight break-words sm:text-3xl">{value}</p>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </CardContent>
    </Card>
  );
}

/** Responsive grid for StatCards, driven by the dashboard content width (not the viewport). */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 @md/main:grid-cols-2 @5xl/main:grid-cols-4", className)}>
      {children}
    </div>
  );
}
