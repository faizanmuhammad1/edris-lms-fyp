import Image from "next/image";
import Link from "next/link";
import { BarChart3, Star } from "lucide-react";
import type { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseImage } from "@/lib/course-images";
import { useConstructUrl } from "@/hooks/use-construct-url";

interface iAppProps {
  data: PublicCourseType;
  isPurchased?: boolean;
  courseStats?: {
    enrollmentCount: number;
    averageRating: number;
    reviewCount: number;
  };
  /** Heading level for the course title, so the card fits the surrounding outline. */
  headingLevel?: "h2" | "h3";
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function PublicCourseCard({ data, isPurchased = false, courseStats, headingLevel = "h3" }: iAppProps) {
  // Not a React hook despite the name: a pure key -> URL helper, safe in server and client components.
  const constructedUrl = useConstructUrl(data.fileKey as string);
  const courseImage = data.fileKey ? constructedUrl : getCourseImage(data.category, data.id);
  const Heading = headingLevel;

  // Only real stats are shown; courses without reviews are labelled "New".
  const ratingCount = courseStats?.reviewCount ?? 0;
  const hasRating = ratingCount > 0;
  const numRating = hasRating ? courseStats!.averageRating : 0;
  const students = courseStats?.enrollmentCount ?? 0;

  const isBestseller = hasRating && numRating >= 4.6 && students > 500;
  const instructorName = data.user?.name || "Edris Instructor";

  return (
    <Link
      href={isPurchased ? `/dashboard/${data.slug}` : `/courses/${data.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={courseImage}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 296px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-background/90 text-foreground shadow-sm backdrop-blur">
            {data.category}
          </Badge>
          {isBestseller && (
            <Badge className="border-transparent bg-amber-400 text-amber-950 shadow-sm">Bestseller</Badge>
          )}
          {isPurchased && <Badge className="shadow-sm">Enrolled</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Heading className="line-clamp-2 break-words text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {data.title}
        </Heading>
        <p className="mt-1.5 truncate text-sm text-muted-foreground">{instructorName}</p>

        <div className="mt-3 flex min-h-5 items-center gap-1.5 text-sm">
          {hasRating ? (
            <>
              <span className="font-semibold text-amber-700 dark:text-amber-400">{numRating.toFixed(1)}</span>
              <span className="flex items-center" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-3.5 ${star <= Math.round(numRating) ? "fill-amber-500 text-amber-500" : "fill-muted text-muted-foreground/30"}`}
                  />
                ))}
              </span>
              <span className="sr-only">out of 5 stars,</span>
              <span className="text-muted-foreground">({ratingCount.toLocaleString()})</span>
            </>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New course</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
            {data.level || "Beginner"}
          </span>
          <span className="text-lg font-semibold text-foreground">
            {isPurchased ? (
              <span className="text-sm font-medium text-primary">Continue learning</span>
            ) : data.price === 0 ? (
              "Free"
            ) : (
              currency.format(data.price)
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card" aria-hidden="true">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-24" />
        <div className="mt-auto flex items-center justify-between border-t pt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
    </div>
  );
}
