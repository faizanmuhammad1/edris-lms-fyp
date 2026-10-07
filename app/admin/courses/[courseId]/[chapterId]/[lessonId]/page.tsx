import type { Metadata } from "next";
import { adminGetLesson } from "@/app/data/admin/admin-get-lesson";
import { PageHeader } from "@/components/general/PageHeader";
import { LessonForm } from "./_components/LessonForm";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export const metadata: Metadata = {
  title: "Admin · Edit lesson",
};

// Video processing and Whisper transcription run in after() within this time limit.
export const maxDuration = 60;

export default async function LessonIdPage({ params }: { params: Params }) {
  const { lessonId } = await params;
  const lesson = await adminGetLesson(lessonId);
  // Use the lesson's real chapter/course so the form and back link stay correct
  const { id: chapterId, courseId, title: chapterTitle, Course } = lesson.Chapter;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{lesson.title}</span>}
        backHref={`/admin/courses/${courseId}/edit?tab=structure`}
        backLabel="Back to course structure"
        description={
          <span className="break-words">
            {Course.title} · Chapter: {chapterTitle}
          </span>
        }
      />
      <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />
    </div>
  );
}
