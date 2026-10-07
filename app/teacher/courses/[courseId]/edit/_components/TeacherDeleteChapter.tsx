"use client";

import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { tryCatch } from "@/hooks/try-catch";
import { deleteTeacherChapter } from "../actions";
import { toast } from "sonner";

export function TeacherDeleteChapter({
  chapterId,
  courseId,
  chapterTitle,
  lessonCount,
}: {
  chapterId: string;
  courseId: string;
  chapterTitle?: string;
  lessonCount?: number;
}) {
  const name = chapterTitle ? `"${chapterTitle}"` : "this chapter";

  async function onConfirm() {
    const { data: result, error } = await tryCatch(
      deleteTeacherChapter({ chapterId, courseId })
    );

    if (error || !result) {
      toast.error("We couldn't delete the chapter. Please try again.");
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
      title="Delete this chapter?"
      description={
        <div className="space-y-2 break-words">
          <p>
            This permanently deletes {name}
            {lessonCount === undefined
              ? " and all of its lessons"
              : lessonCount === 0
                ? ""
                : ` and its ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`}
            .
          </p>
          {lessonCount !== 0 && (
            <p>
              Lesson videos, thumbnails, PDFs and attachments, quizzes and quiz attempts,
              assignments and student submissions, comments and student progress are
              deleted too. This can&apos;t be undone.
            </p>
          )}
          {lessonCount === 0 && <p>This can&apos;t be undone.</p>}
        </div>
      }
      confirmLabel="Delete chapter"
      destructive
      onConfirm={onConfirm}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive md:size-9"
          aria-label={chapterTitle ? `Delete chapter ${chapterTitle}` : "Delete chapter"}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      }
    />
  );
}
