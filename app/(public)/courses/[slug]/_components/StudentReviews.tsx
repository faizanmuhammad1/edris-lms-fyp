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
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    Student Reviews
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Rating summary */}
                <CourseRatingDisplay
                    avgRating={avgRating}
                    reviewCount={reviewCount}
                    reviews={reviews}
                    showDistribution
                />

                {/* Review list */}
                <div className="space-y-4 pt-4 border-t">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>

                {reviewCount > reviews.length && (
                    <p className="text-center text-sm text-muted-foreground">
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
        <div className="flex gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={review.User.image || undefined} alt={review.User.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold">{review.User.name}</span>
                    <div className="flex">
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
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                </div>

                {review.text && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.text}
                    </p>
                )}
            </div>
        </div>
    );
}
