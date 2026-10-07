import { LoadingRegion, PageHeaderSkeleton } from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCommunityPostLoading() {
  return (
    <LoadingRegion label="Loading post">
      <PageHeaderSkeleton withBack withAction />
      <div className="space-y-6" aria-hidden="true">
        <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
