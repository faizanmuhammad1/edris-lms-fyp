import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "../_components/AdminSkeletons";

export default function UsersLoading() {
  return (
    <LoadingRegion label="Loading users">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={5} />
      <TableSkeleton />
    </LoadingRegion>
  );
}
