import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Wraps a loading skeleton so assistive tech announces it once. */
export function LoadingRegion({
  label = "Loading",
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cn("space-y-6", className)}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

export function PageHeaderSkeleton({ withAction = false, withBack = false }: { withAction?: boolean; withBack?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" aria-hidden="true">
      <div className="w-full max-w-md space-y-2">
        {withBack && <Skeleton className="h-4 w-20" />}
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      {withAction && <Skeleton className="h-9 w-36 rounded-md" />}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  const lg: Record<number, string> = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-3 xl:grid-cols-5",
    6: "lg:grid-cols-3 xl:grid-cols-6",
  };
  return (
    <div
      className={cn("grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4", lg[count] ?? "lg:grid-cols-4")}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="size-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Toolbar (search + filter) and table rows; collapses to cards on phones like DataTable. */
export function TableSkeleton({
  rows = 8,
  withToolbar = true,
  withTabs = false,
}: {
  rows?: number;
  withToolbar?: boolean;
  withTabs?: boolean;
}) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {withTabs && <Skeleton className="h-10 w-full max-w-md rounded-lg" />}
      {withToolbar && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <div className="flex gap-2 sm:ml-auto">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      )}
      {/* Phone: card list */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      {/* Tablet/desktop: table */}
      <div className="hidden rounded-xl border bg-card md:block">
        <div className="flex gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="hidden h-4 w-20 lg:block" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, withMedia = false }: { count?: number; withMedia?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
          {withMedia && <Skeleton className="aspect-video w-full rounded-lg" />}
          <div className="flex items-start gap-3">
            {!withMedia && <Skeleton className="size-11 shrink-0 rounded-xl" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function FormCardSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-5 rounded-xl border bg-card p-4 sm:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  );
}
