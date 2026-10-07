import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors CourseContent: title + action, video, description and supporting cards. */
export function LessonSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <span className="sr-only" role="status">
        Loading lesson…
      </span>
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xl space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-3/4" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44" />
      </div>

      <Skeleton className="aspect-video w-full rounded-xl" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
