"use client";

import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DELETE_COURSE_CONSEQUENCES } from "../../../_components/delete-course-copy";
import { deleteTeacherCourse } from "../../delete/actions";

/** Deletes a course after confirmation, then returns to the course list. */
export function DeleteCourseButton({
  courseId,
  courseTitle,
  label = "Delete course",
  className,
}: {
  courseId: string;
  courseTitle: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const { data: result, error } = await tryCatch(deleteTeacherCourse(courseId));
    if (error || result.status !== "success") {
      toast.error(result?.message ?? "We couldn't delete this course. Please try again.");
      return false;
    }
    toast.success(result.message);
    router.replace("/teacher/courses");
    router.refresh();
  }

  return (
    <ConfirmDialog
      title={`Delete "${courseTitle}"?`}
      description={DELETE_COURSE_CONSEQUENCES}
      confirmLabel="Delete course"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button variant="outline" className={className ?? "h-10 text-destructive hover:scale-100 hover:text-destructive"}>
          <Trash2 aria-hidden="true" />
          {label}
        </Button>
      }
    />
  );
}
