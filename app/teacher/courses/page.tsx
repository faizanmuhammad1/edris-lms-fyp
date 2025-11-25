import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { CourseManagement } from "./_components/CourseManagement";
import {
  TeacherCourseCardSkeleton,
} from "./_components/TeacherCourseCard";

export const dynamic = "force-dynamic";

export default function TeacherCoursesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Courses</h1>
          <p className="text-muted-foreground mt-1">
            Organize, edit, and manage all your courses with drag & drop
          </p>
        </div>
        <Link className={buttonVariants()} href="/teacher/courses/new">
          Create Course
        </Link>
      </div>

      <Suspense fallback={<TeacherCourseCardSkeletonLayout />}>
        <RenderCourses />
      </Suspense>
    </>
  );
}

async function RenderCourses() {
  const data = await getTeacherCourses();

  return (
    <>
      {data.length === 0 ? (
        <div className="space-y-6">
          <CourseManagement courses={[]} />
        </div>
      ) : (
        <CourseManagement courses={data} />
      )}
    </>
  );
}

function TeacherCourseCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
      {Array.from({ length: 4 }).map((_, index) => (
        <TeacherCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
