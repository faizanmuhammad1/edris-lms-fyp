import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeaderSkeleton,
  SkeletonPage,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/app/teacher/_components/TeacherSkeletons";

export default function StudentProgressLoading() {
  return (
    <SkeletonPage label="Loading student progress">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="space-y-4">
        <Skeleton className="h-9 w-72 max-w-full rounded-lg" />
        <TableSkeleton rows={6} columns={7} />
      </div>
    </SkeletonPage>
  );
}
