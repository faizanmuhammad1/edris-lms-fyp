import {
  FormCardSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTicketLoading() {
  return (
    <LoadingRegion label="Loading ticket">
      <PageHeaderSkeleton withBack withAction />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-hidden="true">
        <div className="space-y-6">
          <div className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-4 sm:p-6">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="ml-auto h-9 w-32" />
          </div>
        </div>
        <div className="space-y-6">
          <FormCardSkeleton fields={4} />
          <FormCardSkeleton fields={3} />
        </div>
      </div>
    </LoadingRegion>
  );
}
