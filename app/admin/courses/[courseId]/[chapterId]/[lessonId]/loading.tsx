import {
  FormCardSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";

export default function LessonLoading() {
  return (
    <LoadingRegion label="Loading lesson editor">
      <PageHeaderSkeleton withBack />
      <FormCardSkeleton fields={4} />
    </LoadingRegion>
  );
}
