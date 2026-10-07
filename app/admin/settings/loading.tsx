import {
  FormCardSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";

export default function AdminSettingsLoading() {
  return (
    <LoadingRegion label="Loading settings">
      <PageHeaderSkeleton />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <FormCardSkeleton fields={2} />
        <FormCardSkeleton fields={3} />
        <FormCardSkeleton fields={2} />
        <FormCardSkeleton fields={1} />
      </div>
    </LoadingRegion>
  );
}
