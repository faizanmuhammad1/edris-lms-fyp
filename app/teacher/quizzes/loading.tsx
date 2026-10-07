import { PageHeaderSkeleton, SkeletonPage, TableSkeleton } from "@/app/teacher/_components/TeacherSkeletons";

export default function TeacherQuizzesLoading() {
  return (
    <SkeletonPage label="Loading quizzes">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} columns={7} />
    </SkeletonPage>
  );
}
