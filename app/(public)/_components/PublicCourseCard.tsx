import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseImage } from "@/lib/course-images";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: PublicCourseType;
  isPurchased?: boolean;
}

export function PublicCourseCard({ data, isPurchased = false }: iAppProps) {
  const courseImage = getCourseImage(data.category, data.id);

  // Generate consistent mock stats based on course ID
  const hash = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.0 + (hash % 10) / 10).toFixed(1); // 4.0 to 4.9
  const numRating = parseFloat(rating);
  const students = Math.floor(100 + (hash % 5000));
  const ratingCount = Math.floor(students / 5);

  const isBestseller = numRating >= 4.6 && students > 500;

  const instructorName = data.user?.name || "Edris Instructor";

  return (
    <Link href={isPurchased ? `/dashboard/${data.slug}` : `/courses/${data.slug}`}>
      <Card className="group h-full flex flex-col bg-card border border-border/50 hover:border-primary/20 shadow-sm hover:shadow-xl hover:shadow-primary/[0.05] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden rounded-lg mx-3 mt-3">
          <Image
            src={courseImage}
            alt={data.title}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1 gap-1">
          {/* Title */}
          <h3 className="font-bold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {data.title}
          </h3>

          {/* Instructor */}
          <p className="text-xs text-muted-foreground truncate">
            {instructorName}
          </p>

          {/* Rating Row */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm font-bold text-amber-900 dark:text-amber-500">{rating}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${star <= Math.round(numRating)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-muted text-muted"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({ratingCount.toLocaleString()})</span>
          </div>

          {/* Price Row */}
          <div className="mt-2 flex items-center gap-2">
            {data.price === 0 ? (
              <span className="text-lg font-bold text-foreground">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-foreground">${data.price}</span>
                <span className="text-sm text-muted-foreground line-through font-normal">
                  ${(data.price * 1.8).toFixed(0)}
                </span>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="mt-1 flex gap-2 flex-wrap">
            {isBestseller && (
              <Badge variant="secondary" className="bg-[#eceb98] text-amber-950 hover:bg-[#eceb98] font-bold text-[10px] px-1.5 py-0 h-5 rounded-sm border-0">
                Bestseller
              </Badge>
            )}
            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-normal text-[10px] px-1.5 py-0 h-5 rounded-sm border-0">
              {data.category}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <div className="relative aspect-video mx-3 mt-3">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1 mt-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </Card>
  );
}
