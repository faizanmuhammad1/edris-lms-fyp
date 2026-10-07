import {
  CardGridSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunitiesLoading() {
  return (
    <LoadingRegion label="Loading communities">
      <PageHeaderSkeleton withAction />
      <div className="space-y-4" aria-hidden="true">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <Skeleton className="h-4 w-28" />
        </div>
        <CardGridSkeleton count={6} />
      </div>
    </LoadingRegion>
  );
}
