"use client";

import { deleteComment } from "@/app/actions/comments";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Moderator action: delete a forum comment (and its replies) after confirmation. */
export function DeleteCommentButton({ commentId, authorName }: { commentId: string; authorName: string }) {
  const router = useRouter();

  async function handleDelete() {
    try {
      const result = await deleteComment(commentId);
      if (result.status !== "success") {
        toast.error(result.message || "Couldn't delete this comment. Please try again.");
        return false;
      }
      toast.success("Comment deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting the comment. Please try again.");
      return false;
    }
  }

  return (
    <ConfirmDialog
      title="Delete this comment?"
      description={`The comment by ${authorName} and any replies to it will be permanently deleted. This can't be undone.`}
      confirmLabel="Delete comment"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-2 size-10 shrink-0 text-destructive hover:text-destructive"
          aria-label={`Delete comment by ${authorName}`}
          title="Delete comment"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      }
    />
  );
}
