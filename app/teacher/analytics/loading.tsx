import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, SkeletonPage, StatCardsSkeleton, TableSkeleton } from "../_components/TeacherSkeletons";

export default function TeacherAnalyticsLoading() {
  return (
    <SkeletonPage label="Loading analytics">
      <PageHeaderSkeleton withAction={false} />
      <StatCardsSkeleton count={5} className="@4xl/main:grid-cols-3 @5xl/main:grid-cols-3 @7xl/main:grid-cols-5" />
      <div className="grid gap-6 @5xl/main:grid-cols-5">
        <div className="space-y-4 rounded-xl border bg-card p-6 @5xl/main:col-span-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-56 w-full" />
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-6 @5xl/main:col-span-2">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <TableSkeleton rows={4} columns={4} />
      </div>
    </SkeletonPage>
  );
}
