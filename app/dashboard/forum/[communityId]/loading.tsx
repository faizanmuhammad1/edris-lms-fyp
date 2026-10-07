import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../../_components/PageContainer";
import { ListSkeleton, PageHeaderSkeleton } from "../../_components/DashboardSkeletons";

export default function CommunityLoading() {
  return (
    <PageContainer>
      <span className="sr-only" role="status">
        Loading community…
      </span>
      <PageHeaderSkeleton withAction />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-24" />
          <ListSkeleton rows={4} />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
