import { getTeacherLesson } from "@/app/data/teacher/get-teacher-lesson";
import { TeacherLessonForm } from "./_components/TeacherLessonForm";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export const dynamic = "force-dynamic";

// Video processing and Whisper transcription run in after() within this time limit.
export const maxDuration = 60;

export default async function TeacherLessonPage({ params }: { params: Params }) {
  const { chapterId, courseId, lessonId } = await params;
  const lesson = await getTeacherLesson(lessonId);

  return <TeacherLessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
}

