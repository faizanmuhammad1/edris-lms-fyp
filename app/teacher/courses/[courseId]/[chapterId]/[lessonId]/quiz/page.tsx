import type { Metadata } from "next";
import { getTeacherQuiz } from "@/app/data/teacher/get-teacher-quiz";
import { QuizEditor } from "./_components/QuizEditor";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quiz editor",
};

export default async function QuizPage({ params }: { params: Params }) {
  const { courseId, chapterId, lessonId } = await params;
  const quiz = await getTeacherQuiz(lessonId);

  return (
    <QuizEditor
      // Remount when the quiz is created or deleted so the form starts from fresh values.
      key={quiz?.id ?? "new"}
      lessonId={lessonId}
      courseId={courseId}
      chapterId={chapterId}
      initialData={quiz}
    />
  );
}
