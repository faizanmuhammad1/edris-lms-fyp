"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/app/actions/reviews";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function ReviewForm({ courseId }: { courseId: string }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        startTransition(async () => {
            const result = await createReview(courseId, rating, text);
            if (result.status === "success") {
                toast.success(result.message);
                router.refresh();
                setRating(0);
                setText("");
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-card">
            <h3 className="text-lg font-semibold">Leave a Review</h3>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="focus:outline-none"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                    >
                        <Star
                            className={cn(
                                "w-6 h-6 transition-colors",
                                (hover || rating) >= star
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                            )}
                        />
                    </button>
                ))}
            </div>
            <Textarea
                placeholder="Share your thoughts about this course..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
            />
            <Button type="submit" disabled={isPending}>
                {isPending ? "Posting..." : "Post Review"}
            </Button>
        </form>
    );
}
