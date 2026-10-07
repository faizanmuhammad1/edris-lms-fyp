import { SkeletonPage } from "@/app/teacher/_components/TeacherSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketDetailLoading() {
  return (
    <SkeletonPage label="Loading ticket">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-48 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-3/4 max-w-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-4 rounded-xl border bg-card p-6">
            <Skeleton className="h-4 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="space-y-3 rounded-xl border bg-card p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
