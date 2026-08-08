"use client";
import { getAvatarUrl } from "@/lib/avatar";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment, CommentWithReplies } from "@/app/actions/comments";
import { formatDistanceToNow } from "date-fns";
import { Reply, Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function CommentForm({
    lessonId,
    parentId,
    placeholder = "Write a comment...",
    onSuccess
}: {
    lessonId: string,
    parentId?: string,
    placeholder?: string,
    onSuccess?: () => void
}) {
    const [text, setText] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        startTransition(async () => {
            const result = await createComment(lessonId, text, parentId);
            if (result.status === "success") {
                toast.success(result.message);
                setText("");
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-4">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                className="min-h-[80px]"
            />
            <Button type="submit" size="icon" disabled={isPending || !text.trim()} className="h-[80px] w-[80px]">
                <Send className="w-5 h-5" />
            </Button>
        </form>
    );
}

function SingleComment({ comment, lessonId }: { comment: CommentWithReplies, lessonId: string }) {
    const [isReplying, setIsReplying] = useState(false);

    return (
        <div className="group">
            <div className="flex gap-4">
                <Avatar className="w-10 h-10 border">
                    <AvatarImage src={comment.User.image || ""} />
                    <AvatarFallback>
                        <Image
                            src={getAvatarUrl(comment.User.name)}
                            alt={comment.User.name}
                            fill
                            className="object-cover"
                        />
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.User.name}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed">{comment.text}</p>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsReplying(!isReplying)}
                    >
                        <Reply className="w-3 h-3 mr-1" /> Reply
                    </Button>

                    {isReplying && (
                        <div className="mt-4 pl-4 border-l-2">
                            <CommentForm
                                lessonId={lessonId}
                                parentId={comment.id}
                                placeholder={`Reply to ${comment.User.name}...`}
                                onSuccess={() => setIsReplying(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {comment.replies.length > 0 && (
                <div className="mt-4 ml-10 space-y-4">
                    {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-4">
                            <Avatar className="w-8 h-8 border">
                                <AvatarImage src={reply.User.image || ""} />
                                <AvatarFallback>
                                    <Image
                                        src={getAvatarUrl(reply.User.name)}
                                        alt={reply.User.name}
                                        fill
                                        className="object-cover"
                                    />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{reply.User.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm">{reply.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function CommentSection({ lessonId, comments }: { lessonId: string, comments: CommentWithReplies[] }) {
    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Discussion</h3>
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                    {comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)}
                </span>
            </div>

            <CommentForm lessonId={lessonId} />

            <div className="space-y-6 mt-8">
                {comments.map((comment) => (
                    <SingleComment key={comment.id} comment={comment} lessonId={lessonId} />
                ))}
            </div>
        </div>
    );
}
