import type { Metadata } from "next";
import { AlertTriangle, BookX } from "lucide-react";
import { adminGetCourseDeleteSummary } from "@/app/data/admin/admin-get-course";
import { CourseStatusBadge } from "@/app/admin/_components/StatusBadge";
import { formatNumber, pluralize } from "@/app/admin/_lib/format";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { DeleteCourseForm } from "./_components/DeleteCourseForm";

type Params = Promise<{ courseId: string }>;

export const metadata: Metadata = {
  title: "Admin · Delete course",
};

export default async function DeleteCourseRoute({ params }: { params: Params }) {
  const { courseId } = await params;
  const course = await adminGetCourseDeleteSummary(courseId);

  if (!course) {
    return (
      <div className="space-y-6">
        <PageHeader title="Delete course" backHref="/admin/courses" backLabel="All courses" />
        <EmptyState
          icon={BookX}
          title="This course no longer exists"
          description="It may have just been deleted. Return to the course list to manage the remaining courses."
          buttonText="Back to courses"
          href="/admin/courses"
        />
      </div>
    );
  }

  const consequences = [
    { label: "Chapters", count: course._count.chapter },
    { label: "Lessons, with their videos and files", count: course.lessonCount },
    { label: "Student enrollments", count: course._count.enrollment },
    { label: "Reviews", count: course._count.reviews },
    { label: "Certificates", count: course._count.certificates },
    { label: "Communities", count: course._count.communities },
  ];
  const enrolled = course._count.enrollment;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Delete course"
        backHref={`/admin/courses/${course.id}/edit`}
        backLabel="Back to course"
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="break-words font-medium text-foreground">{course.title}</span>
            <CourseStatusBadge status={course.status} />
            {course.user?.name && <span>by {course.user.name}</span>}
          </span>
        }
      />

      {enrolled > 0 && (
        <div className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <p>
            <strong className="font-semibold">Warning:</strong> {pluralize(enrolled, "student is", "students are")}{" "}
            enrolled. They will immediately lose access to this course, its progress and certificates.
            Payments are not refunded automatically.
          </p>
        </div>
      )}

      <Card className="gap-4 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-4 sm:px-6">
          <h2 className="text-lg font-semibold leading-none">What will be deleted</h2>
          <CardDescription>
            Everything below is permanently removed, including the course image and all
            uploaded lesson files.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            {consequences.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
              >
                <dt className="min-w-0 text-sm text-muted-foreground">{item.label}</dt>
                <dd className="text-base font-semibold tabular-nums">{formatNumber(item.count)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <DeleteCourseForm courseId={course.id} courseTitle={course.title} />
    </div>
  );
}
