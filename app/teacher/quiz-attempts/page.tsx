import { redirect } from "next/navigation";

// Quiz attempts live in the "Quiz attempts" tab of Student progress (same data, plus assignments and per-student views).
export default function TeacherQuizAttemptsPage() {
  redirect("/teacher/student-progress?tab=quizzes");
}
