import { PageHeader } from "@/components/general/PageHeader";
import { CourseCreationForm } from "@/components/dashboard/forms/course-creation-form";
import type { Metadata } from "next";
import { CreateTeacherCourse } from "./actions";

export const metadata: Metadata = { title: "Create course" };

export default function TeacherCourseCreationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create a course"
        description="Start with the basics. You'll add chapters and lessons next, and the course stays a private draft until you publish it."
        backHref="/teacher/courses"
        backLabel="All courses"
      />
      <CourseCreationForm action={CreateTeacherCourse} backLink="/teacher/courses" role="teacher" />
    </div>
  );
}
