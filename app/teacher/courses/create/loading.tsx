import { FormSkeleton, PageHeaderSkeleton, SkeletonPage } from "../../_components/TeacherSkeletons";

export default function TeacherCreateCourseLoading() {
  return (
    <SkeletonPage label="Loading form">
      <PageHeaderSkeleton withBack withAction={false} />
      <FormSkeleton fields={6} />
    </SkeletonPage>
  );
}
