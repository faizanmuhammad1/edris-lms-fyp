"use client";

import { useId, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Reply, Send } from "lucide-react";
import { toast } from "sonner";
import { createComment, CommentWithReplies } from "@/app/actions/comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAvatarUrl } from "@/lib/avatar";

const MAX_LENGTH = 2000;

function CommentForm({
  lessonId,
  parentId,
  label,
  placeholder = "Share a question or insight about this lesson…",
  submitLabel = "Post comment",
  onSuccess,
  onCancel,
  autoFocus = false,
}: {
  lessonId: string;
  parentId?: string;
  label: string;
  placeholder?: string;
  submitLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputId = useId();
  const countId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    startTransition(async () => {
      try {
        const result = await createComment(lessonId, text, parentId);
        if (result.status === "success") {
          toast.success(parentId ? "Reply posted" : "Comment posted");
          setText("");
          router.refresh();
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("We couldn't post your comment. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor={inputId} className={parentId ? "sr-only" : undefined}>
        {label}
      </Label>
      <Textarea
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_LENGTH}
        disabled={isPending}
        autoFocus={autoFocus}
        aria-describedby={countId}
        className="min-h-[88px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={countId} className="text-xs text-muted-foreground tabular-nums">
          {text.length}/{MAX_LENGTH}
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending || !text.trim()} aria-busy={isPending}>
            {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            {isPending ? "Posting…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function UserAvatar({ name, image, className }: { name: string; image: string | null; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src={image || ""} alt="" />
      <AvatarFallback>
        <Image src={getAvatarUrl(name)} alt="" fill className="object-cover" />
      </AvatarFallback>
    </Avatar>
  );
}

function SingleComment({ comment, lessonId }: { comment: CommentWithReplies; lessonId: string }) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <li>
      <article className="flex gap-3 sm:gap-4">
        <UserAvatar name={comment.User.name} image={comment.User.image} className="size-9 shrink-0 border sm:size-10" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold break-words">{comment.User.name}</span>
            <time dateTime={new Date(comment.createdAt).toISOString()} className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.text}</p>

          {!isReplying ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsReplying(true)}
            >
              <Reply aria-hidden="true" />
              Reply<span className="sr-only"> to {comment.User.name}</span>
            </Button>
          ) : (
            <div className="mt-3 border-l-2 pl-3 sm:pl-4">
              <CommentForm
                lessonId={lessonId}
                parentId={comment.id}
                label={`Reply to ${comment.User.name}`}
                placeholder={`Reply to ${comment.User.name}…`}
                submitLabel="Post reply"
                autoFocus
                onSuccess={() => setIsReplying(false)}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {comment.replies.length > 0 && (
            <ul className="mt-3 space-y-4" aria-label={`Replies to ${comment.User.name}`}>
              {comment.replies.map((reply) => (
                <li key={reply.id} className="flex gap-3">
                  <UserAvatar name={reply.User.name} image={reply.User.image} className="size-8 shrink-0 border" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-semibold break-words">{reply.User.name}</span>
                      <time
                        dateTime={new Date(reply.createdAt).toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{reply.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </li>
  );
}

export function CommentSection({ lessonId, comments }: { lessonId: string; comments: CommentWithReplies[] }) {
  const headingId = useId();
  const total = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <section aria-labelledby={headingId} className="w-full space-y-6 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <h2 id={headingId} className="text-xl font-semibold">
          Discussion
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {total}
          <span className="sr-only"> {total === 1 ? "comment" : "comments"}</span>
        </span>
      </div>

      <CommentForm lessonId={lessonId} label="Add a comment" />

      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
          <MessageSquare className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No comments yet. Start the discussion!</p>
        </div>
      ) : (
        <ul className="space-y-6">
          {comments.map((comment) => (
            <SingleComment key={comment.id} comment={comment} lessonId={lessonId} />
          ))}
        </ul>
      )}
    </section>
  );
}
