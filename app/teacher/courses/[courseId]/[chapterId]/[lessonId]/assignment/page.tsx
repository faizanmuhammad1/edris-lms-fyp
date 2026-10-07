import type { Metadata } from "next";
import { getTeacherAssignment } from "@/app/data/teacher/get-teacher-assignment";
import { PageHeader } from "@/components/general/PageHeader";
import { AssignmentEditor } from "./_components/AssignmentEditor";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assignment",
};

export default async function TeacherAssignmentPage({ params }: { params: Params }) {
  const { lessonId } = await params;
  const data = await getTeacherAssignment(lessonId);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/teacher/courses/${data.courseId}/${data.chapterId}/${lessonId}`}
        backLabel="Back to lesson"
        title={<span className="break-words">{data.assignment?.title || "Create assignment"}</span>}
        description={
          data.assignment
            ? `Assignment for “${data.lessonTitle}”. Edit the brief and grade submissions.`
            : `Add an assignment to “${data.lessonTitle}” so students can hand in work.`
        }
      />
      <AssignmentEditor
        // Remount when the assignment is first created so the form starts from saved values.
        key={data.assignment?.id ?? "new"}
        lessonId={lessonId}
        courseId={data.courseId}
        chapterId={data.chapterId}
        initialData={data}
      />
    </div>
  );
}
