import {
  CardListSkeleton,
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonPage,
} from "@/app/teacher/_components/TeacherSkeletons";

export default function QuizEditorLoading() {
  return (
    <SkeletonPage label="Loading quiz">
      <PageHeaderSkeleton withBack withAction />
      <FormSkeleton fields={2} />
      <CardListSkeleton count={3} />
    </SkeletonPage>
  );
}
