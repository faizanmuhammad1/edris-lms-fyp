import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, SkeletonPage } from "../../../_components/TeacherSkeletons";

export default function DeleteCourseLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <SkeletonPage label="Loading course">
        <PageHeaderSkeleton withBack withAction={false} />
        <div className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </SkeletonPage>
    </div>
  );
}
