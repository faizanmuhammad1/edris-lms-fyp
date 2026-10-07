import { Skeleton } from "@/components/ui/skeleton";
import { CourseCardGridSkeleton, PageHeaderSkeleton, SkeletonPage } from "../_components/TeacherSkeletons";

export default function TeacherCoursesLoading() {
  return (
    <SkeletonPage label="Loading courses">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full space-y-1.5 sm:max-w-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-full space-y-1.5 sm:w-48">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <CourseCardGridSkeleton count={6} />
    </SkeletonPage>
  );
}
