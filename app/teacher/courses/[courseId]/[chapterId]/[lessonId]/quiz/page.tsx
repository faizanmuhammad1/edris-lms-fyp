import { getTeacherQuiz } from "@/app/data/teacher/get-teacher-quiz";
import { QuizEditor } from "./_components/QuizEditor";

type Params = Promise<{
    courseId: string;
    chapterId: string;
    lessonId: string;
}>;

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Params }) {
    const { courseId, chapterId, lessonId } = await params;
    const quiz = await getTeacherQuiz(lessonId);

    return (
        <div className="p-6">
            <QuizEditor
                lessonId={lessonId}
                courseId={courseId}
                chapterId={chapterId}
                initialData={quiz}
            />
        </div>
    );
}
