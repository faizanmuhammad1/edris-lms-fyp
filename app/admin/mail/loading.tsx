import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/AdminSkeletons";

export default function MailLoading() {
  return (
    <LoadingRegion label="Loading campaigns">
      <PageHeaderSkeleton withAction />
      <StatCardsSkeleton count={4} />
      <div className="space-y-4" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <TableSkeleton rows={6} withToolbar />
      </div>
    </LoadingRegion>
  );
}
