import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../../../_components/PageContainer";
import { ListSkeleton } from "../../../_components/DashboardSkeletons";

export default function PostLoading() {
  return (
    <PageContainer width="medium">
      <span className="sr-only" role="status">
        Loading post…
      </span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-3 rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <ListSkeleton rows={2} />
    </PageContainer>
  );
}
