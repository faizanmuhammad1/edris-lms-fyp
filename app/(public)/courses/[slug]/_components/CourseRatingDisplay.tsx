import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CourseRatingDisplayProps {
    avgRating: number;
    reviewCount: number;
    reviews: Array<{ rating: number }>;
    showDistribution?: boolean;
}

export function CourseRatingDisplay({
    avgRating,
    reviewCount,
    reviews,
    showDistribution = false,
}: CourseRatingDisplayProps) {
    // Calculate rating distribution
    const distribution = [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((r) => r.rating === stars).length;
        const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
        return { stars, count, percentage };
    });

    return (
        <div className="flex flex-col gap-4">
            {/* Main rating display */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500">
                        {avgRating.toFixed(1)}
                    </span>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-5 w-5 ${star <= Math.round(avgRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-muted text-muted"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <span className="text-muted-foreground">
                    ({reviewCount.toLocaleString()} {reviewCount === 1 ? "rating" : "ratings"})
                </span>
            </div>

            {/* Rating distribution bars */}
            {showDistribution && reviewCount > 0 && (
                <div className="space-y-2">
                    {distribution.map(({ stars, percentage }) => (
                        <div key={stars} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-16">
                                <span className="text-sm text-muted-foreground">{stars}</span>
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            </div>
                            <Progress value={percentage} className="h-2 flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                                {percentage.toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Compact inline rating (for headers)
export function CourseRatingInline({
    avgRating,
    reviewCount,
    studentCount,
}: {
    avgRating: number;
    reviewCount: number;
    studentCount: number;
}) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {reviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-500">{avgRating.toFixed(1)}</span>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-4 w-4 ${star <= Math.round(avgRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-muted/30 text-muted/30"
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-muted-foreground">
                        ({reviewCount.toLocaleString()} ratings)
                    </span>
                </div>
            )}
            {studentCount > 0 && (
                <span className="text-muted-foreground">
                    {studentCount.toLocaleString()} students
                </span>
            )}
        </div>
    );
}
