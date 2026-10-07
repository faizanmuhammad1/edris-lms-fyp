"use client";

import { createComment } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const commentSchema = z.object({
    text: z.string().min(1, "Comment cannot be empty").max(1000),
});

interface CreateCommentFormProps {
    postId: string;
}

export function CreateCommentForm({ postId }: CreateCommentFormProps) {
    const [text, setText] = useState("");
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!text.trim()) return;

        startTransition(async () => {
            const result = await createComment({ text }, postId);

            if (!result.success) {
                toast.error(result.error || "Failed to post comment");
                return;
            }

            toast.success("Comment posted");
            setText("");
            router.refresh();
        });
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <Textarea
                placeholder="Write a comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px]"
            />
            <div className="flex justify-end">
                <Button type="submit" disabled={pending || !text.trim()}>
                    {pending ? (
                        <>Posting... <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
                    ) : (
                        <>Post Comment <Send className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
            </div>
        </form>
    );
}
