"use client";

import { createComment } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

// Mirrors the server-side limit in app/actions/community.ts.
const MAX_LENGTH = 1000;

interface CreateCommentFormProps {
  postId: string;
}

export function CreateCommentForm({ postId }: CreateCommentFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!text.trim()) {
      setError("Write a comment before posting.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createComment({ text }, postId);

        if (!result.success) {
          setError(result.error || "We couldn't post your comment. Please try again.");
          toast.error(result.error || "We couldn't post your comment. Please try again.");
          return;
        }

        toast.success("Comment posted");
        setText("");
        setError(null);
        router.refresh();
      } catch {
        toast.error("We couldn't post your comment. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <Label htmlFor={inputId}>Add a comment</Label>
      <Textarea
        id={inputId}
        placeholder="Write a comment…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        maxLength={MAX_LENGTH}
        disabled={pending}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${errorId} ${hintId}` : hintId}
        className="min-h-[100px]"
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {error && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <p id={hintId} className="text-xs text-muted-foreground tabular-nums">
            {text.length}/{MAX_LENGTH}
          </p>
        </div>
        <Button type="submit" size="lg" disabled={pending || !text.trim()} aria-busy={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          {pending ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
