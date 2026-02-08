import { prisma } from "@/lib/db";
import { CourseManagementTable } from "./_components/CourseManagementTable";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

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
  const courses = await getAllCourses();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">
            View and manage all courses on the platform. Delete or archive courses as needed.
          </p>
        </div>
        <Link
          href="/admin/courses/create"
          className={buttonVariants({ className: "w-fit shrink-0" })}
        >
          Create course
        </Link>
      </div>

      <CourseManagementTable courses={courses} />
    </div>
  );
}
