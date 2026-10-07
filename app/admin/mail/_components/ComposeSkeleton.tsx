import { Skeleton } from "@/components/ui/skeleton";
import {
  FormCardSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";

/** Mirrors ComposeForm: message card beside the audience and send panels. */
export function ComposeSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label}>
      <PageHeaderSkeleton withBack />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" aria-hidden="true">
        <div className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <div className="overflow-hidden rounded-lg border">
              <Skeleton className="h-[3.25rem] w-full rounded-none" />
              <Skeleton className="h-[280px] w-full rounded-none opacity-60" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <FormCardSkeleton fields={4} />
          <FormCardSkeleton fields={1} />
        </div>
      </div>
    </LoadingRegion>
  );
}
