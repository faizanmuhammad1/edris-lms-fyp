import { CardListSkeleton, PageHeaderSkeleton, SkeletonPage, StatCardsSkeleton } from "@/app/teacher/_components/TeacherSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageCommunityLoading() {
  return (
    <SkeletonPage label="Loading community">
      <PageHeaderSkeleton withBack />
      <Skeleton className="h-10 w-full rounded-lg sm:w-72" />
      <StatCardsSkeleton count={4} />
      <CardListSkeleton count={1} />
    </SkeletonPage>
  );
}
