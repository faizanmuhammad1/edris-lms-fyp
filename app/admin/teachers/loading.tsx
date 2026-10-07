import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "../_components/AdminSkeletons";

export default function TeachersLoading() {
  return (
    <LoadingRegion label="Loading teachers">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={5} />
      <TableSkeleton />
    </LoadingRegion>
  );
}
