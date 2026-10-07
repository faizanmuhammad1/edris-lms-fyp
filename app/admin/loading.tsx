import {
  ChartSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "./_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Dashboard skeleton (also the fallback for admin routes without their own loading.tsx). */
export default function AdminLoading() {
  return (
    <LoadingRegion label="Loading dashboard">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
        <div className="lg:col-span-2">
          <ChartSkeleton height={250} />
        </div>
        <div className="space-y-3 rounded-xl border bg-card p-4 sm:p-6">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 2 }).map((_, card) => (
          <div key={card} className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
