import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseImage } from "@/lib/course-images";
import { Clock, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: PublicCourseType;
  isPurchased?: boolean;
}

export function PublicCourseCard({ data, isPurchased = false }: iAppProps) {
  const courseImage = getCourseImage(data.category, data.id);

  // Generate a mock rating based on course ID for consistency
  const hash = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.3 + (hash % 8) / 10).toFixed(1);
  const students = `${Math.floor(100 + (hash % 900))}k`;

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 flex flex-col h-full">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={courseImage}
          alt={data.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-none shadow-lg font-semibold px-3 py-1">
          {data.level}
        </Badge>

        <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
          <Link href={isPurchased ? `/dashboard/${data.slug}` : `/courses/${data.slug}`}>
            <Button className="w-full bg-primary/90 hover:bg-primary text-white shadow-lg backdrop-blur-md">
              {isPurchased ? "Continue Learning" : "Enroll Now"}
            </Button>
          </Link>
        </div>
      </div>

      <CardContent className="p-6 flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <Badge variant="secondary" className="text-xs font-normal bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 transition-colors">
              {data.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              <span>{data.duration}h</span>
            </div>
          </div>

          <Link href={`/courses/${data.slug}`}>
            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {data.title}
            </h3>
          </Link>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {data.smallDescription}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-sm font-bold text-foreground">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span>{rating}</span>
              <span className="text-muted-foreground font-normal text-xs">({students})</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {data.price === 0 ? (
              <span className="font-bold text-xl text-primary">Free</span>
            ) : (
              <>
                <span className="font-bold text-xl text-primary">${data.price}</span>
                <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">
                  ${(data.price * 1.5).toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-full">
      <div className="relative aspect-video overflow-hidden">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <CardContent className="p-6 flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>

          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
