import {
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonPage,
  TableSkeleton,
} from "@/app/teacher/_components/TeacherSkeletons";

export default function AssignmentEditorLoading() {
  return (
    <SkeletonPage label="Loading assignment">
      <PageHeaderSkeleton withBack withAction={false} />
      <FormSkeleton fields={4} />
      <TableSkeleton rows={4} columns={6} />
    </SkeletonPage>
  );
}
