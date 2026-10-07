import { PageContainer } from "../_components/PageContainer";
import { CourseCardSkeleton, PageHeaderSkeleton } from "../_components/DashboardSkeletons";

export default function CoursesLoading() {
  return (
    <PageContainer>
      <span className="sr-only" role="status">
        Loading your courses…
      </span>
      <PageHeaderSkeleton withAction />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
