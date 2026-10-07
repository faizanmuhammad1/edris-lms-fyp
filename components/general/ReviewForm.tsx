"use client";

import { useId, useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 2000;
const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ courseId }: { courseId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ rating?: string; text?: string }>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const formId = useId();
  const ratingErrorId = `${formId}-rating-error`;
  const textErrorId = `${formId}-text-error`;
  const textId = `${formId}-text`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const nextErrors: typeof errors = {};
    if (rating === 0) nextErrors.rating = "Choose a star rating.";
    if (!text.trim()) nextErrors.text = "Write a few words about the course.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      try {
        const result = await createReview(courseId, rating, text);
        if (result.status === "success") {
          toast.success(result.message);
          router.refresh();
          setRating(0);
          setText("");
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("We couldn't post your review. Please try again.");
      }
    });
  };

  const shown = hover || rating;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <h3 className="text-lg font-semibold">Leave a review</h3>

      <fieldset aria-describedby={errors.rating ? ratingErrorId : undefined}>
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="flex flex-wrap items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              className="flex size-10 cursor-pointer items-center justify-center rounded-md has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
              onMouseEnter={() => setHover(star)}
            >
              <input
                type="radio"
                name={`${formId}-rating`}
                value={star}
                checked={rating === star}
                onChange={() => {
                  setRating(star);
                  setErrors((prev) => ({ ...prev, rating: undefined }));
                }}
                disabled={isPending}
                className="sr-only"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-7 transition-colors",
                  shown >= star ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"
                )}
              />
              <span className="sr-only">
                {star} star{star === 1 ? "" : "s"} ({RATING_LABELS[star - 1]})
              </span>
            </label>
          ))}
          <span className="ml-2 text-sm text-muted-foreground" aria-hidden="true">
            {shown > 0 ? RATING_LABELS[shown - 1] : "Select a rating"}
          </span>
        </div>
        {errors.rating && (
          <p id={ratingErrorId} className="mt-1 text-sm text-destructive">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={textId}>Your review</Label>
        <Textarea
          id={textId}
          placeholder="What did you like? What could be better?"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (errors.text) setErrors((prev) => ({ ...prev, text: undefined }));
          }}
          rows={4}
          maxLength={MAX_LENGTH}
          disabled={isPending}
          aria-invalid={!!errors.text || undefined}
          aria-describedby={errors.text ? textErrorId : undefined}
        />
        <div className="flex justify-between gap-2">
          {errors.text ? (
            <p id={textErrorId} className="text-sm text-destructive">
              {errors.text}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isPending} aria-busy={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isPending ? "Posting…" : "Post review"}
      </Button>
    </form>
  );
}
