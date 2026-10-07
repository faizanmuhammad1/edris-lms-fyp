import { FormSkeleton, PageHeaderSkeleton, SkeletonPage } from "@/app/teacher/_components/TeacherSkeletons";

export default function NewTicketLoading() {
  return (
    <SkeletonPage label="Loading ticket form">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <PageHeaderSkeleton withAction={false} />
        <FormSkeleton fields={4} />
      </div>
    </SkeletonPage>
  );
}
