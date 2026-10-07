import { getTeacherReviews } from "@/app/actions/review";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import { DeleteReviewButton } from "@/components/teacher/DeleteReviewButton";

export const dynamic = "force-dynamic";

export default async function TeacherReviewsPage() {
    const reviews = await getTeacherReviews();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Course Reviews</h1>

            {reviews.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        No reviews found for your courses yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {reviews.map((review) => (
                        <Card key={review.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.User.image || ""} />
                                        <AvatarFallback>{review.User.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">{review.User.name}</CardTitle>
                                        <CardDescription className="text-sm">
                                            on {review.Course.title}
                                        </CardDescription>
                                    </div>
                                </div>
                                <DeleteReviewButton reviewId={review.id} />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-1 mb-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                                }`}
                                        />
                                    ))}
                                    <span className="text-sm text-muted-foreground ml-2">
                                        {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{review.text}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
