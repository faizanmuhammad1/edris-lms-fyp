import { Skeleton } from "@/components/ui/skeleton";
import {
  CourseCardGridSkeleton,
  PageHeaderSkeleton,
  SkeletonPage,
  StatCardsSkeleton,
} from "./_components/TeacherSkeletons";

export default function TeacherLoading() {
  return (
    <SkeletonPage label="Loading dashboard">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-32" />
        </div>
        <CourseCardGridSkeleton count={4} />
      </div>
    </SkeletonPage>
  );
}
