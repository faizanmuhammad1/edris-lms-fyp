import { FormSkeleton, PageHeaderSkeleton, SkeletonPage } from "@/app/teacher/_components/TeacherSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-5 rounded-xl border bg-card p-6">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function TeacherSettingsLoading() {
  return (
    <SkeletonPage label="Loading settings">
      <PageHeaderSkeleton withAction={false} />
      <FormSkeleton fields={2} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={4} />
      </div>
    </SkeletonPage>
  );
}
