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
  const countsByStar = reviews.reduce<Record<number, number>>((acc, review) => {
    acc[review.rating] = (acc[review.rating] ?? 0) + 1;
    return acc;
  }, {});

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = countsByStar[stars] ?? 0;
    const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
    return { stars, count, percentage };
  });

  const recommendedCount = reviews.filter((review) => review.rating >= 4).length;
  const recommendationRate =
    reviewCount > 0 ? Math.round((recommendedCount / reviewCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
        <div className="rounded-xl border border-border/60 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-5">
          <p className="text-sm text-muted-foreground">Average rating</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-bold text-amber-500">
              {avgRating.toFixed(1)}
            </span>
            <span className="pb-1 text-sm text-muted-foreground">/ 5</span>
          </div>
          <div className="mt-2 flex">
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
          <p className="mt-3 text-xs text-muted-foreground">
            {reviewCount.toLocaleString()} {reviewCount === 1 ? "rating" : "ratings"}
          </p>
        </div>

        {showDistribution && reviewCount > 0 ? (
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Rating breakdown</p>
              <p className="text-xs text-muted-foreground">
                {recommendationRate}% recommend this course
              </p>
            </div>
            <div className="space-y-2.5">
              {distribution.map(({ stars, percentage, count }) => (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex w-16 items-center gap-1">
                    <span className="text-sm text-muted-foreground">{stars}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <Progress value={percentage} className="h-2 flex-1 bg-muted/50" />
                  <span className="w-9 text-right text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <p className="text-sm text-muted-foreground">
              {reviewCount > 0
                ? `${recommendationRate}% of students rated this course 4 stars or higher.`
                : "No ratings yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
