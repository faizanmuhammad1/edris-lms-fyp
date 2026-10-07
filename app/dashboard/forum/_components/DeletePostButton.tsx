"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost } from "@/app/actions/post";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";

/** Delete a forum post (author, course teacher or admin; the server re-checks permission). */
export function DeletePostButton({
  postId,
  postTitle,
  redirectTo,
}: {
  postId: string;
  postTitle: string;
  /** Where to go after deleting (e.g. back to the community from the post page). */
  redirectTo?: string;
}) {
  const router = useRouter();

  async function handleDelete(): Promise<boolean> {
    try {
      const result = await deletePost(postId);
      if (result.status === "success") {
        toast.success("Post deleted");
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
        return true;
      }
      toast.error(result.message || "We couldn't delete this post. Please try again.");
      return false;
    } catch {
      toast.error("We couldn't delete this post. Please try again.");
      return false;
    }
  }

  return (
    <ConfirmDialog
      title="Delete this post?"
      description={`“${postTitle}” and all of its comments will be permanently deleted.`}
      confirmLabel="Delete post"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Delete post: ${postTitle}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      }
    />
  );
}
