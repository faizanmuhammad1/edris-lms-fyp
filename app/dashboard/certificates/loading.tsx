import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../_components/PageContainer";
import { PageHeaderSkeleton } from "../_components/DashboardSkeletons";

export default function CertificatesLoading() {
  return (
    <PageContainer>
      <span className="sr-only" role="status">
        Loading certificates…
      </span>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
