import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSupportLoading() {
  return (
    <LoadingRegion label="Loading support tickets">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={5} />
      <div className="space-y-4" aria-hidden="true">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11rem))]">
          <div className="space-y-1.5 sm:col-span-3 xl:col-span-1">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-9 w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <TableSkeleton rows={8} withToolbar={false} />
      </div>
    </LoadingRegion>
  );
}
