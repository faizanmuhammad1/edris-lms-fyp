import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageHeader } from "@/components/general/PageHeader";
import { LoadingRegion, StatCardsSkeleton, TableSkeleton } from "../_components/AdminSkeletons";
import { CourseManagementView } from "./_components/CourseManagementView";

export const metadata = {
  title: "Admin · Courses",
  description: "Manage all courses on the platform",
};

async function getAllCourses() {
  return prisma.course.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      price: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          enrollment: true,
          chapter: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CoursesPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Review every course on the platform. Edit, publish, unpublish, archive or delete courses."
      />

      <Suspense
        fallback={
          <LoadingRegion label="Loading courses">
            <StatCardsSkeleton count={4} />
            <TableSkeleton />
          </LoadingRegion>
        }
      >
        <CourseManagementList />
      </Suspense>
    </div>
  );
}

async function CourseManagementList() {
  const courses = await getAllCourses();
  return <CourseManagementView courses={courses} />;
}
