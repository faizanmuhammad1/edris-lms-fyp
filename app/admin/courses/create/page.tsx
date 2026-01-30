"use client";

import { CreateCourse } from "./actions";
import { CourseCreationForm } from "@/components/dashboard/forms/course-creation-form";

export default function CourseCreationPage() {
  return (
    <CourseCreationForm
      action={CreateCourse}
      backLink="/admin/courses"
      role="admin"
    />
  );
}
