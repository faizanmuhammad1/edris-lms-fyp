import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading student progress">
      <PageHeaderSkeleton withAction />
      <StatCardsSkeleton count={4} />
      <div className="space-y-4">
        <div className="space-y-2" aria-hidden="true">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <TableSkeleton rows={8} />
      </div>
    </LoadingRegion>
  );
}
