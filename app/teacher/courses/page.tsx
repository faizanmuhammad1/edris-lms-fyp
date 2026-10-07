import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "@/components/general/EmptyState";
import { Suspense } from "react";
import {
  TeacherCourseCard,
  TeacherCourseCardSkeleton,
} from "./_components/TeacherCourseCard";

export default function TeacherCoursesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Courses</h1>

        <Link className={buttonVariants()} href="/teacher/courses/create">
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
        <EmptyState
          title="No courses found"
          description="Create a new course to get started"
          buttonText="Create Course"
          href="/teacher/courses/create"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
          {data.map((course) => (
            <TeacherCourseCard key={course.id} data={course} />
          ))}
        </div>
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
