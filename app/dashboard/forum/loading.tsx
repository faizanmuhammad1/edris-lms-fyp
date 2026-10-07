import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../_components/PageContainer";
import { PageHeaderSkeleton } from "../_components/DashboardSkeletons";

export default function ForumLoading() {
  return (
    <PageContainer>
      <span className="sr-only" role="status">
        Loading communities…
      </span>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
