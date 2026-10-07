import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, ListChecks } from "lucide-react";
import { getTeacherLesson } from "@/app/data/teacher/get-teacher-lesson";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TeacherLessonForm } from "./_components/TeacherLessonForm";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export const dynamic = "force-dynamic";

// Video processing and Whisper transcription run in after() within this time limit.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Edit lesson",
};

export default async function TeacherLessonPage({ params }: { params: Params }) {
  const { chapterId, courseId, lessonId } = await params;
  // 404s when the lesson doesn't exist or belongs to another teacher
  const lesson = await getTeacherLesson(lessonId);

  // The chapter in the URL must be the lesson's own chapter
  if (lesson.chapterId !== chapterId) {
    notFound();
  }

  const lessonPath = `/teacher/courses/${courseId}/${chapterId}/${lessonId}`;
  const showQuizLink = lesson.lessonType === "Video" || !!lesson.quiz;
  const linkClass = cn(buttonVariants({ variant: "outline" }), "h-10 sm:h-9");

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{lesson.title}</span>}
        description="Edit this lesson's content, media and resources. Students see changes after you save."
        backHref={`/teacher/courses/${courseId}/edit`}
        backLabel="Back to course"
        actions={
          <>
            {showQuizLink && (
              <Link href={`${lessonPath}/quiz`} className={linkClass}>
                <ListChecks aria-hidden="true" />
                {lesson.quiz ? "Edit quiz" : "Add quiz"}
                {lesson.quiz && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({lesson.quiz.isPublished ? "published" : "draft"})
                  </span>
                )}
              </Link>
            )}
            <Link href={`${lessonPath}/assignment`} className={linkClass}>
              <ClipboardList aria-hidden="true" />
              Assignment
            </Link>
          </>
        }
      />

      <TeacherLessonForm data={lesson} chapterId={lesson.chapterId} courseId={courseId} />
    </div>
  );
}
