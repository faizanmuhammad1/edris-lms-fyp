import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ReviewWithUser = {
    id: string;
    rating: number;
    text: string | null;
    createdAt: Date;
    User: {
        name: string;
        image: string | null;
    };
};

export function ReviewList({ reviews }: { reviews: ReviewWithUser[] }) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                No reviews yet. Be the first to review!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Student Reviews ({reviews.length})</h3>
            {reviews.map((review) => (
                <Card key={review.id} className="border-none shadow-none bg-muted/20">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Avatar>
                            <AvatarImage src={review.User.image || ""} />
                            <AvatarFallback>{review.User.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{review.User.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                                        }`}
                                />
                            ))}
                        </div>
                        {review.text && <p className="text-sm">{review.text}</p>}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
