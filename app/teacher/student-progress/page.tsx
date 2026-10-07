import type { Metadata } from "next";
import { getTeacherQuizAttempts } from "@/app/data/teacher/get-teacher-quiz-attempts";
import { getTeacherAssignmentSubmissions } from "@/app/data/teacher/get-teacher-assignment-submissions";
import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { StudentProgressClient } from "./_components/StudentProgressClient";
import { PROGRESS_TABS, type ProgressTab } from "./_components/progress-utils";

export const metadata: Metadata = {
  title: "Student progress",
  description: "Quiz attempts and assignment submissions across your courses",
};

export default async function StudentProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ tab }, attempts, submissions, courses] = await Promise.all([
    searchParams,
    getTeacherQuizAttempts(),
    getTeacherAssignmentSubmissions(),
    getTeacherCourses(),
  ]);

  const initialTab = PROGRESS_TABS.find((t) => t === tab) as ProgressTab | undefined;

  return (
    <StudentProgressClient
      initialAttempts={attempts}
      initialSubmissions={submissions}
      courses={courses.map((c) => ({ id: c.id, title: c.title }))}
      initialTab={initialTab}
    />
  );
}
