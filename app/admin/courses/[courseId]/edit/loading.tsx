import {
  FormCardSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
} from "@/app/admin/_components/AdminSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCourseLoading() {
  return (
    <LoadingRegion label="Loading course editor">
      <PageHeaderSkeleton withBack withAction />
      <Skeleton className="h-11 w-full rounded-lg" aria-hidden="true" />
      <FormCardSkeleton fields={6} />
    </LoadingRegion>
  );
}
