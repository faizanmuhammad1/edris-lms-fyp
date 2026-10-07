import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TeacherCourseList } from "./_components/TeacherCourseList";

export const metadata: Metadata = { title: "Courses" };

export default async function TeacherCoursesPage() {
  const courses = await getTeacherCourses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Create, edit and publish your courses."
        actions={
          courses.length > 0 && (
            <Link className={buttonVariants({ className: "h-10" })} href="/teacher/courses/create">
              <Plus aria-hidden="true" />
              Create course
            </Link>
          )
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You haven't created any courses yet"
          description="Start with the basics (title, description, price and a thumbnail), then add chapters and lessons. Courses stay private as drafts until you publish them."
          buttonText="Create your first course"
          href="/teacher/courses/create"
        />
      ) : (
        <TeacherCourseList courses={courses} />
      )}
    </div>
  );
}
