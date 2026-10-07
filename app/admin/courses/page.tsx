import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { CourseManagementView } from "./_components/CourseManagementView";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/app/data/admin/require-admin";

export const metadata = {
  title: "Course Management | Admin",
  description: "Manage all courses on the platform",
};

async function getAllCourses() {
  const courses = await prisma.course.findMany({
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
  return courses;
}

export default async function CoursesPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all courses on the platform. Delete or archive courses as needed.
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CourseManagementList />
      </Suspense>
    </div>
  );
}

async function CourseManagementList() {
  const courses = await getAllCourses();
  return <CourseManagementView courses={courses} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-12">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
