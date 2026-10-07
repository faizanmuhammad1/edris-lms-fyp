import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading skeletons for teacher routes. They mirror the real page layouts
 * (PageHeader, stat cards, tables, card grids, forms) so content doesn't jump
 * when it streams in. Use them from each route's loading.tsx.
 */

/** Grid used by course card lists; sized by the dashboard content width (the layout's @container/main). */
export const COURSE_GRID =
  "grid grid-cols-1 gap-5 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 @[100rem]/main:grid-cols-4";

/** Wrapper that announces the loading state to assistive tech once per page. */
export function SkeletonPage({ children, label = "Loading page" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label={label}>
      {children}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function PageHeaderSkeleton({ withAction = true, withBack = false }: { withAction?: boolean; withBack?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-xl space-y-2">
        {withBack && <Skeleton className="h-4 w-24" />}
        <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {withAction && <Skeleton className="h-9 w-36 rounded-md" />}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 @md/main:grid-cols-2 @5xl/main:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-5 rounded-md" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 4, withToolbar = true }: { rows?: number; columns?: number; withToolbar?: boolean }) {
  return (
    <div className="space-y-4">
      {withToolbar && <Skeleton className="h-9 w-full rounded-md sm:max-w-xs" />}
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden rounded-xl border bg-card md:block">
        <div className="flex gap-4 border-b p-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className={cn("h-4 flex-1", j === 0 && "h-8")} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CourseCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={COURSE_GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-12" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md sm:w-40" />
    </div>
  );
}
