"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pluralize } from "@/app/admin/_lib/format";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { deleteChapter } from "../actions";

export function DeleteChapter({
  chapterId,
  courseId,
  chapterTitle,
  lessonCount,
}: {
  chapterId: string;
  courseId: string;
  chapterTitle: string;
  lessonCount: number;
}) {
  const router = useRouter();

  async function handleConfirm() {
    const { data: result, error } = await tryCatch(deleteChapter({ chapterId, courseId }));

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
      title="Delete this chapter?"
      description={
        <div className="space-y-2">
          <p>
            <span className="font-medium text-foreground break-words">&ldquo;{chapterTitle}&rdquo;</span>{" "}
            will be permanently deleted
            {lessonCount > 0
              ? ` along with its ${pluralize(lessonCount, "lesson")}, their videos, files and student progress.`
              : "."}
          </p>
          <p>This can&rsquo;t be undone.</p>
        </div>
      }
      confirmLabel="Delete chapter"
      destructive
      onConfirm={handleConfirm}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete chapter: ${chapterTitle}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      }
    />
  );
}
