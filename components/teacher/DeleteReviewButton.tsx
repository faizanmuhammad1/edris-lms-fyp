"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { deleteReview } from "@/app/actions/review";

interface DeleteReviewButtonProps {
    reviewId: string;
    /** Used for the accessible label and confirmation text. */
    studentName?: string;
    courseTitle?: string;
}

export function DeleteReviewButton({ reviewId, studentName, courseTitle }: DeleteReviewButtonProps) {
    const label = studentName ? `Delete review by ${studentName}` : "Delete review";

    const handleDelete = async () => {
        try {
            const res = await deleteReview(reviewId);
            if (res.error) {
                // The action throws for "not found" / "not yours"; its message isn't reliable in production.
                toast.error("Couldn't delete this review. Refresh the page and try again.");
                return false;
            }
            // The action revalidates /teacher/reviews, so the list updates with its response.
            toast.success("Review deleted");
            return true;
        } catch {
            toast.error("Something went wrong. Please try again.");
            return false;
        }
    };

    return (
        <ConfirmDialog
            title="Delete this review?"
            description={
                <>
                    {studentName ? (
                        <>
                            The review by <strong className="text-foreground">{studentName}</strong>
                        </>
                    ) : (
                        "This review"
                    )}
                    {courseTitle ? (
                        <>
                            {" "}
                            on <strong className="text-foreground">{courseTitle}</strong>
                        </>
                    ) : null}{" "}
                    will be permanently deleted. It will no longer appear on the course page or count toward the
                    course&apos;s average rating. This can&apos;t be undone.
                </>
            }
            confirmLabel="Delete review"
            destructive
            onConfirm={handleDelete}
            trigger={
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={label}
                    title={label}
                >
                    <Trash2 aria-hidden="true" />
                </Button>
            }
        />
    );
}
