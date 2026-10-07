import { PageHeaderSkeleton, SkeletonPage, TableSkeleton } from "@/app/teacher/_components/TeacherSkeletons";

export default function TeacherReviewsLoading() {
  return (
    <SkeletonPage label="Loading reviews">
      <PageHeaderSkeleton withAction={false} />
      <TableSkeleton rows={6} columns={6} />
    </SkeletonPage>
  );
}
