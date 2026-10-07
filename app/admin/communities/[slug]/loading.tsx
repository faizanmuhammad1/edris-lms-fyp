import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageCommunityLoading() {
  return (
    <LoadingRegion label="Loading community">
      <PageHeaderSkeleton withBack withAction />
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-10 w-full rounded-lg sm:w-80" />
        <StatCardsSkeleton count={3} />
        <div className="space-y-3 rounded-xl border bg-card p-4 sm:p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </LoadingRegion>
  );
}
