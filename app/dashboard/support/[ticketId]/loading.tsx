import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../../_components/PageContainer";

export default function TicketLoading() {
  return (
    <PageContainer>
      <span className="sr-only" role="status">
        Loading ticket…
      </span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-4 rounded-xl border bg-card p-6">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
