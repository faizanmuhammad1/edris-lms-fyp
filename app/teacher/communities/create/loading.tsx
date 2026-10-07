import { FormSkeleton, PageHeaderSkeleton, SkeletonPage } from "@/app/teacher/_components/TeacherSkeletons";

export default function CreateCommunityLoading() {
  return (
    <SkeletonPage label="Loading community form">
      <PageHeaderSkeleton withAction={false} withBack />
      <div className="max-w-2xl">
        <FormSkeleton fields={2} />
      </div>
    </SkeletonPage>
  );
}
