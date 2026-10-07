import { CardListSkeleton, PageHeaderSkeleton, SkeletonPage } from "@/app/teacher/_components/TeacherSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ForumPostLoading() {
  return (
    <SkeletonPage label="Loading post">
      <PageHeaderSkeleton withBack />
      <div className="max-w-3xl space-y-8">
        <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <CardListSkeleton count={3} />
        </div>
      </div>
    </SkeletonPage>
  );
}
