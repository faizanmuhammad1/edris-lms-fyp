import { CardListSkeleton, PageHeaderSkeleton, SkeletonPage } from "@/app/teacher/_components/TeacherSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherSupportLoading() {
  return (
    <SkeletonPage label="Loading support tickets">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-full rounded-md sm:w-40" />
        <Skeleton className="h-9 w-full rounded-md sm:w-44" />
      </div>
      <CardListSkeleton count={4} />
    </SkeletonPage>
  );
}
