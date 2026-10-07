import { CardListSkeleton, PageHeaderSkeleton, SkeletonPage } from "@/app/teacher/_components/TeacherSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityForumLoading() {
  return (
    <SkeletonPage label="Loading forum">
      <PageHeaderSkeleton withBack />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-6 w-24" />
          <CardListSkeleton count={4} />
        </div>
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-2 gap-3 border-t pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
