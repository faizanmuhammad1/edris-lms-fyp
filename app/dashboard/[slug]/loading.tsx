import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../_components/PageContainer";

export default function CourseOverviewLoading() {
  return (
    <PageContainer width="medium">
      <span className="sr-only" role="status">
        Loading course…
      </span>
      <div className="space-y-3">
        <Skeleton className="h-9 w-3/4" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </PageContainer>
  );
}
