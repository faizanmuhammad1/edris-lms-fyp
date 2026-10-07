"use client";

import { deletePost } from "@/app/actions/post";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
  commentCount: number;
  /** Where to go after deleting (e.g. back to the forum from the post page). Refreshes in place when omitted. */
  redirectTo?: string;
  /** "icon" renders a compact icon button (with an accessible name). */
  display?: "icon" | "label";
  className?: string;
}

/** Moderator action: permanently delete a forum post and its comments after confirmation. */
export function DeletePostButton({
  postId,
  postTitle,
  commentCount,
  redirectTo,
  display = "label",
  className,
}: DeletePostButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    try {
      const result = await deletePost(postId);
      if (result.status !== "success") {
        toast.error(result.message || "Couldn't delete this post. Please try again.");
        return false;
      }
      toast.success(result.message || "Post deleted");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting the post. Please try again.");
      return false;
    }
  }

  const label = `Delete post "${postTitle}"`;

  return (
    <ConfirmDialog
      title="Delete this post?"
      description={
        <div className="space-y-2">
          <p>
            <span className="font-medium break-words text-foreground">&ldquo;{postTitle}&rdquo;</span> and its{" "}
            {commentCount} {commentCount === 1 ? "comment" : "comments"} will be permanently deleted for everyone in the
            community.
          </p>
          <p>This can&apos;t be undone.</p>
        </div>
      }
      confirmLabel="Delete post"
      destructive
      onConfirm={handleDelete}
      trigger={
        display === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-10 text-destructive hover:text-destructive", className)}
            aria-label={label}
            title="Delete post"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className={cn("h-10 text-destructive hover:text-destructive", className)}
            aria-label={label}
          >
            <Trash2 aria-hidden="true" />
            Delete post
          </Button>
        )
      }
    />
  );
}
