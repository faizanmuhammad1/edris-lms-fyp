import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "../_components/AdminSkeletons";

export default function CoursesLoading() {
  return (
    <LoadingRegion label="Loading courses">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <TableSkeleton />
    </LoadingRegion>
  );
}
