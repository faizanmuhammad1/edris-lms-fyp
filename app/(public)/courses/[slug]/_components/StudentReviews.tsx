import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseRatingDisplay } from "./CourseRatingDisplay";
import { formatDistanceToNow } from "date-fns";

interface Review {
    id: string;
    rating: number;
    text: string | null;
    createdAt: Date;
    User: {
        id: string;
        name: string;
        image: string | null;
    };
}

interface StudentReviewsProps {
    reviews: Review[];
    avgRating: number;
    reviewCount: number;
    ratingCounts?: Record<number, number>;
}

export function StudentReviews({
    reviews,
    avgRating,
    reviewCount,
    ratingCounts,
}: StudentReviewsProps) {
    if (reviewCount === 0) {
        return null;
    }

    return (
        <section aria-labelledby="reviews-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight">
                    Student reviews
                </h2>
                <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {reviewCount.toLocaleString()} total
                </span>
            </div>

            <CourseRatingDisplay
                avgRating={avgRating}
                reviewCount={reviewCount}
                reviews={reviews}
                ratingCounts={ratingCounts}
                showDistribution
            />

            <ul className="space-y-3">
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </ul>

            {reviewCount > reviews.length && (
                <p className="rounded-md bg-muted/30 py-2 text-center text-sm text-muted-foreground">
                    Showing the {reviews.length} most recent of {reviewCount.toLocaleString()} reviews
                </p>
            )}
        </section>
    );
}

function ReviewCard({ review }: { review: Review }) {
    const initials = review.User.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <li className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex gap-3 sm:gap-4">
                <Avatar className="size-10 shrink-0 sm:size-12">
                    <AvatarImage src={review.User.image || undefined} alt="" />
                    <AvatarFallback className="bg-primary/10 font-medium text-primary">{initials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="break-words font-semibold">{review.User.name}</p>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <div className="mt-1 flex" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`size-4 ${star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-muted-foreground/30"
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="sr-only">Rated {review.rating} out of 5</span>

                    {review.text ? (
                        <p className="mt-2 break-words text-sm leading-relaxed text-foreground/90">{review.text}</p>
                    ) : (
                        <p className="mt-2 text-sm italic text-muted-foreground">No written comment provided.</p>
                    )}
                </div>
            </div>
        </li>
    );
}
