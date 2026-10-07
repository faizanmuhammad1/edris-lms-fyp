import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "./_components/PageContainer";
import { CourseCardSkeleton, PageHeaderSkeleton } from "./_components/DashboardSkeletons";

export default function DashboardLoading() {
  return (
    <PageContainer>
      <span className="sr-only" role="status">
        Loading your dashboard…
      </span>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="mt-3 h-4 w-24" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
