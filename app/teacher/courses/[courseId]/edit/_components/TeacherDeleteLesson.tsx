"use client";

import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { tryCatch } from "@/hooks/try-catch";
import { deleteTeacherLesson } from "../actions";
import { toast } from "sonner";

export function TeacherDeleteLesson({
  chapterId,
  courseId,
  lessonId,
  lessonTitle,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
}) {
  async function onConfirm() {
    const { data: result, error } = await tryCatch(
      deleteTeacherLesson({ chapterId, courseId, lessonId })
    );

    if (error || !result) {
      toast.error("We couldn't delete the lesson. Please try again.");
      return false;
    }

    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }

    toast.success(result.message);
  }

  return (
    <ConfirmDialog
      title="Delete this lesson?"
      description={
        <div className="space-y-2 break-words">
          <p>
            This permanently deletes {lessonTitle ? `"${lessonTitle}"` : "this lesson"} with
            its video, thumbnail, PDF and attachments.
          </p>
          <p>
            Its quiz and quiz attempts, assignment and student submissions, comments and
            student progress are deleted too. This can&apos;t be undone.
          </p>
        </div>
      }
      confirmLabel="Delete lesson"
      destructive
      onConfirm={onConfirm}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive md:size-9"
          aria-label={lessonTitle ? `Delete lesson ${lessonTitle}` : "Delete lesson"}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      }
    />
  );
}
