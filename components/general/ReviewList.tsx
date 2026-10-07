import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatar";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to review this course!
      </div>
    );
  }

  return (
    <ul className="space-y-4" aria-label="Student reviews">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={review.User.image || ""} alt="" />
              <AvatarFallback>
                <Image src={getAvatarUrl(review.User.name)} alt="" fill className="object-cover" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold break-words">{review.User.name}</p>
              <time dateTime={new Date(review.createdAt).toISOString()} className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </time>
            </div>
          </div>
          <div className="mt-3 flex" role="img" aria-label={`Rated ${review.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                aria-hidden="true"
                className={cn(
                  "size-4",
                  i < review.rating ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/40"
                )}
              />
            ))}
          </div>
          {review.text && <p className="mt-2 text-sm whitespace-pre-wrap break-words">{review.text}</p>}
        </li>
      ))}
    </ul>
  );
}
