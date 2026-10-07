import {
  FormCardSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function DeleteCourseLoading() {
  return (
    <LoadingRegion label="Loading course details" className="mx-auto w-full max-w-2xl">
      <PageHeaderSkeleton withBack />
      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <FormCardSkeleton fields={1} />
    </LoadingRegion>
  );
}
