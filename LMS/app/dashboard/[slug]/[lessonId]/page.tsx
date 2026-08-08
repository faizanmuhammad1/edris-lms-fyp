import { getLessonContent } from "@/app/data/course/get-lesson-content";
import { getLessonComments } from "@/app/actions/comments";
import { CourseContent } from "./_components/CourseContent";
import { Suspense } from "react";
import { LessonSkeleton } from "./_components/LessonSkeleton";

type Params = Promise<{ lessonId: string }>;

export default async function LessonContentPage({
  params,
}: {
  params: Params;
}) {
  const { lessonId } = await params;

  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContentLoader lessonId={lessonId} />
    </Suspense>
  );
}

async function LessonContentLoader({ lessonId }: { lessonId: string }) {
  const data = await getLessonContent(lessonId);
  const comments = await getLessonComments(lessonId);
  return <CourseContent data={data} comments={comments} />;
}
