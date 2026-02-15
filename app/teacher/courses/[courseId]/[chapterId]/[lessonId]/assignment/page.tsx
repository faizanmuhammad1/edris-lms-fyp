import { getTeacherAssignment } from "@/app/data/teacher/get-teacher-assignment";
import { AssignmentEditor } from "./_components/AssignmentEditor";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export const dynamic = "force-dynamic";

export default async function TeacherAssignmentPage({ params }: { params: Params }) {
  const { courseId, chapterId, lessonId } = await params;
  const data = await getTeacherAssignment(lessonId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href={`/teacher/courses/${courseId}/${chapterId}/${lessonId}`}>
        <Button variant="outline" className="mb-6 gap-2">
          <ArrowLeft className="size-4" />
          Back to lesson
        </Button>
      </Link>
      <AssignmentEditor
        lessonId={lessonId}
        courseId={data.courseId}
        chapterId={data.chapterId}
        initialData={data}
      />
    </div>
  );
}
