"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { deleteLesson } from "../actions";

export function DeleteLesson({
  chapterId,
  courseId,
  lessonId,
  lessonTitle,
  hasVideo,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  hasVideo: boolean;
}) {
  const router = useRouter();

  async function handleConfirm() {
    const { data: result, error } = await tryCatch(
      deleteLesson({ chapterId, courseId, lessonId })
    );

    if (error) {
      toast.error("Couldn't reach the server. Check your connection and try again.");
      return false;
    }

    if (result.status !== "success") {
      toast.error(result.message);
      return false;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <ConfirmDialog
      title="Delete this lesson?"
      description={
        <div className="space-y-2">
          <p>
            <span className="font-medium text-foreground break-words">&ldquo;{lessonTitle}&rdquo;</span>{" "}
            will be permanently deleted
            {hasVideo ? ", including its video, " : ", including its "}
            files, quiz, assignment and student progress.
          </p>
          <p>This can&rsquo;t be undone.</p>
        </div>
      }
      confirmLabel="Delete lesson"
      destructive
      onConfirm={handleConfirm}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete lesson: ${lessonTitle}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      }
    />
  );
}
