import { LoadingRegion, PageHeaderSkeleton } from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCommunityForumLoading() {
  return (
    <LoadingRegion label="Loading forum">
      <PageHeaderSkeleton withBack withAction />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" aria-hidden="true">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="size-9 shrink-0 rounded-md" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="h-fit space-y-3 rounded-xl border bg-card p-4 sm:p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </LoadingRegion>
  );
}
