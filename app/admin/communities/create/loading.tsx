import {
  FormCardSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";

export default function CreateCommunityLoading() {
  return (
    <LoadingRegion label="Loading form">
      <PageHeaderSkeleton withBack />
      <div className="max-w-2xl">
        <FormCardSkeleton fields={2} />
      </div>
    </LoadingRegion>
  );
}
