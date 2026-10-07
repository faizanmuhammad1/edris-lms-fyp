import { getTeacherCourse } from "@/app/data/teacher/get-teacher-course";
import { PageHeader } from "@/components/general/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { DELETE_COURSE_CONSEQUENCES } from "../../_components/delete-course-copy";
import { DeleteCourseConfirm } from "./_components/DeleteCourseConfirm";

type Params = Promise<{ courseId: string }>;

export const metadata: Metadata = { title: "Delete course" };

export const dynamic = "force-dynamic";

export default async function DeleteCourseRoute({ params }: { params: Params }) {
  const { courseId } = await params;
  // Also verifies ownership (404 for courses the teacher doesn't own).
  const course = await getTeacherCourse(courseId);
  const lessonCount = course.chapter.reduce((sum, chapter) => sum + chapter.lessons.length, 0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Delete course"
        description={<span className="break-words">{course.title}</span>}
        backHref={`/teacher/courses/${courseId}/edit`}
        backLabel="Back to course"
      />

      <Card className="py-0">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>This can&apos;t be undone</AlertTitle>
            <AlertDescription>{DELETE_COURSE_CONSEQUENCES}</AlertDescription>
          </Alert>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Chapters</dt>
              <dd className="text-lg font-semibold tabular-nums">{course.chapter.length}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Lessons</dt>
              <dd className="text-lg font-semibold tabular-nums">{lessonCount}</dd>
            </div>
          </dl>

          <p className="text-sm text-muted-foreground">
            Want to stop new enrollments without losing anything? Set the course status to{" "}
            <span className="font-medium text-foreground">Archived</span> on the course details tab instead.
          </p>

          <DeleteCourseConfirm courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  );
}
