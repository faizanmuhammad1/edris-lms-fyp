import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton, PageHeaderSkeleton, SkeletonPage } from "../../../_components/TeacherSkeletons";

export default function TeacherEditCourseLoading() {
  return (
    <SkeletonPage label="Loading course">
      <PageHeaderSkeleton withBack />
      <Skeleton className="h-10 w-full rounded-lg sm:w-80" />
      <FormSkeleton fields={6} />
    </SkeletonPage>
  );
}
