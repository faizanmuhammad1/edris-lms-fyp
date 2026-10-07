import {
  ChartSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

function SectionHeadingSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <LoadingRegion label="Loading analytics" className="space-y-8">
      <PageHeaderSkeleton />

      <div className="space-y-4">
        <SectionHeadingSkeleton />
        <StatCardsSkeleton count={4} />
        <ChartSkeleton height={300} />
      </div>

      <div className="space-y-4">
        <SectionHeadingSkeleton />
        <StatCardsSkeleton count={4} />
      </div>

      <div className="space-y-4">
        <SectionHeadingSkeleton />
        <TableSkeleton rows={5} withToolbar={false} />
      </div>
    </LoadingRegion>
  );
}
