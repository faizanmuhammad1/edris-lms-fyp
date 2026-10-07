import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../../_components/PageContainer";
import { PageHeaderSkeleton } from "../../_components/DashboardSkeletons";

export default function NewTicketLoading() {
  return (
    <PageContainer width="narrow">
      <span className="sr-only" role="status">
        Loading form…
      </span>
      <PageHeaderSkeleton />
      <div className="space-y-5 rounded-xl border bg-card p-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-36 w-full" />
        <div className="flex justify-end gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </PageContainer>
  );
}
