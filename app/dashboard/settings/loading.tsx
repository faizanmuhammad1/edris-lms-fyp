import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../_components/PageContainer";
import { PageHeaderSkeleton } from "../_components/DashboardSkeletons";

export default function SettingsLoading() {
  return (
    <PageContainer width="medium">
      <span className="sr-only" role="status">
        Loading settings…
      </span>
      <PageHeaderSkeleton />
      <div className="space-y-6 rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full sm:size-20" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
    </PageContainer>
  );
}
