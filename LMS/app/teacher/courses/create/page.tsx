"use client";

import { CreateTeacherCourse } from "./actions";
import { CourseCreationForm } from "@/components/dashboard/forms/course-creation-form";

export default function TeacherCourseCreationPage() {
  return (
    <CourseCreationForm
      action={CreateTeacherCourse}
      backLink="/teacher/courses"
      role="teacher"
    />
  );
}
