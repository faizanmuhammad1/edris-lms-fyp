"use client";

import { createComment } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

const MAX_LENGTH = 1000;

/** Labelled comment box for the teacher forum post page. */
export function CommentForm({ postId }: { postId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const id = useId();
  const textareaId = `${id}-comment`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = text.trim();
    if (!value) {
      setError("Write a comment before posting.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const result = await createComment({ text: value }, postId);
        if (!result.success) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success("Comment posted");
        setText("");
        router.refresh();
      } catch {
        toast.error("Something went wrong while posting your comment. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-xl border bg-card p-4" noValidate>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={textareaId}>Add a comment</Label>
        <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">
          {text.length}/{MAX_LENGTH}
        </span>
      </div>
      <Textarea
        id={textareaId}
        placeholder="Reply to the discussion, answer a question or add guidance..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        maxLength={MAX_LENGTH}
        disabled={pending}
        aria-invalid={!!error}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        className="min-h-24"
      />
      <p id={hintId} className="text-xs text-muted-foreground">
        Your comment is visible to everyone in this community.
      </p>
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" className="h-10 w-full sm:w-auto" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          {pending ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
