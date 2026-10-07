import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function StudentReviews({
    reviews,
    avgRating,
    reviewCount,
}: StudentReviewsProps) {
    if (reviewCount === 0) {
        return null;
    }

    return (
        <Card className="overflow-hidden border border-border/60 bg-card/70 backdrop-blur-sm">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />

            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span>Student Reviews</span>
                    </div>
                    <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {reviewCount} total
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <CourseRatingDisplay
                    avgRating={avgRating}
                    reviewCount={reviewCount}
                    reviews={reviews}
                    showDistribution
                />

                <div className="space-y-3 border-t border-border/60 pt-5">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>

                {reviewCount > reviews.length && (
                    <p className="rounded-md bg-muted/30 py-2 text-center text-sm text-muted-foreground">
                        Showing {reviews.length} of {reviewCount} reviews
                    </p>
                )}
            </CardContent>
        </Card>
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
        <div className="rounded-xl border border-border/60 bg-gradient-to-b from-muted/40 to-transparent p-4 transition-colors hover:bg-muted/50">
            <div className="flex gap-4">
                <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background">
                <AvatarImage src={review.User.image || undefined} alt={review.User.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {initials}
                </AvatarFallback>
            </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{review.User.name}</span>
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600">
                            {review.rating}.0
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <div className="mb-2.5 flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-muted"
                                    }`}
                            />
                        ))}
                    </div>

                    {review.text ? (
                        <p className="text-sm leading-relaxed text-foreground/90">
                            {review.text}
                        </p>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">
                            No written comment provided.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
