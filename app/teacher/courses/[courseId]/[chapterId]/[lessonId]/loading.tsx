import { Skeleton } from "@/components/ui/skeleton";
import {
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonPage,
} from "@/app/teacher/_components/TeacherSkeletons";

export default function LessonLoading() {
  return (
    <SkeletonPage label="Loading lesson editor">
      <PageHeaderSkeleton withBack withAction />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <FormSkeleton fields={2} />
          <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
