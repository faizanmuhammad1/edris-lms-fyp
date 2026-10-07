import type { Metadata } from "next";
import { getLessonContent } from "@/app/data/course/get-lesson-content";
import { getLessonComments } from "@/app/actions/comments";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { CourseContent } from "./_components/CourseContent";

type Params = Promise<{ lessonId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLessonContent(lessonId);
  return { title: `${lesson.title} · ${lesson.Chapter.Course.title}` };
}

function parseJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default async function LessonContentPage({ params }: { params: Params }) {
  const { lessonId } = await params;
  // loading.tsx shows the lesson skeleton while these resolve.
  const [data, comments] = await Promise.all([getLessonContent(lessonId), getLessonComments(lessonId)]);

  // Rich text is rendered on the server so the editor libraries stay out of the lesson bundle.
  const descriptionJson = parseJson(data.description);
  const assignmentJson = parseJson(data.assignment?.description);

  return (
    <CourseContent
      data={data}
      comments={comments}
      description={descriptionJson ? <RenderDescription json={descriptionJson} /> : null}
      assignmentDescription={
        assignmentJson ? (
          <RenderDescription json={assignmentJson} className="prose-sm" />
        ) : data.assignment?.description ? (
          <p className="text-sm whitespace-pre-wrap break-words">{data.assignment.description}</p>
        ) : null
      }
    />
  );
}
