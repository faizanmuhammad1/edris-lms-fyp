import { getTeacherQuizAttempts } from "@/app/data/teacher/get-teacher-quiz-attempts";
import { getTeacherAssignmentSubmissions } from "@/app/data/teacher/get-teacher-assignment-submissions";
import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { StudentProgressClient } from "./_components/StudentProgressClient";

export const metadata = {
  title: "Student Progress",
  description: "Quiz attempts and assignment submissions across your courses",
};

export default async function StudentProgressPage() {
  const [attempts, submissions, courses] = await Promise.all([
    getTeacherQuizAttempts(),
    getTeacherAssignmentSubmissions(),
    getTeacherCourses(),
  ]);

  return (
    <StudentProgressClient
      initialAttempts={attempts}
      initialSubmissions={submissions}
      courses={courses.map((c) => ({ id: c.id, title: c.title }))}
    />
  );
}
