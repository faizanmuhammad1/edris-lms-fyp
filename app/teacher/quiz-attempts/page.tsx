import { getTeacherQuizAttempts } from "@/app/data/teacher/get-teacher-quiz-attempts";
import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { TeacherQuizAttemptsClient } from "./_components/TeacherQuizAttemptsClient";

export const metadata = {
  title: "Quiz attempts",
  description: "Quiz attempts and integrity for your courses",
};

export default async function TeacherQuizAttemptsPage() {
  const [attempts, courses] = await Promise.all([
    getTeacherQuizAttempts(),
    getTeacherCourses(),
  ]);

  return (
    <TeacherQuizAttemptsClient
      initialAttempts={attempts}
      courses={courses.map((c) => ({ id: c.id, title: c.title }))}
    />
  );
}
