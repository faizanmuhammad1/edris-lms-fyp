import { PageHeaderSkeleton, SkeletonPage, TableSkeleton } from "@/app/teacher/_components/TeacherSkeletons";

export default function TeacherStudentsLoading() {
  return (
    <SkeletonPage label="Loading students">
      <PageHeaderSkeleton withAction={false} />
      <TableSkeleton rows={8} columns={6} />
    </SkeletonPage>
  );
}
