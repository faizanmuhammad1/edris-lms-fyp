import { getQuizForWindow } from "../_components/get-quiz-data";
import { QuizWindow } from "../_components/QuizWindow";
import { notFound } from "next/navigation";

type Params = Promise<{ slug: string; lessonId: string }>;

export default async function QuizPage({ params }: { params: Params }) {
  const { lessonId } = await params;

  const quizData = await getQuizForWindow(lessonId);

  if (!quizData) {
    notFound();
  }

  return <QuizWindow quizData={quizData} lessonId={lessonId} />;
}
