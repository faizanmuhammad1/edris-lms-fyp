import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../_components/PageContainer";
import { ListSkeleton, PageHeaderSkeleton } from "../_components/DashboardSkeletons";

export default function SupportLoading() {
  return (
    <PageContainer width="medium">
      <span className="sr-only" role="status">
        Loading support tickets…
      </span>
      <PageHeaderSkeleton withAction />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 flex-1" />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Skeleton className="h-10 sm:w-40" />
          <Skeleton className="h-10 sm:w-44" />
        </div>
      </div>
      <ListSkeleton rows={4} />
    </PageContainer>
  );
}
