"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteReview } from "@/app/actions/review";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteReviewButtonProps {
    reviewId: string;
}

export function DeleteReviewButton({ reviewId }: DeleteReviewButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        setLoading(true);
        try {
            const res = await deleteReview(reviewId);
            if (res.error) {
                toast.error(res.error.message || "Failed to delete review");
            } else {
                toast.success("Review deleted successfully");
                router.refresh();
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Delete</span>
        </Button>
    );
}
