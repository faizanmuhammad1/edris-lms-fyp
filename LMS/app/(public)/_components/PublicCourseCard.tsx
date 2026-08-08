"use client";

import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { getCourseImage } from "@/lib/course-images";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { Star, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

interface iAppProps {
  data: PublicCourseType;
  isPurchased?: boolean;
  courseStats?: {
    enrollmentCount: number;
    averageRating: number;
    reviewCount: number;
  };
}

export function PublicCourseCard({ data, isPurchased = false, courseStats }: iAppProps) {
  const constructedUrl = useConstructUrl(data.fileKey as string);
  const courseImage = data.fileKey ? constructedUrl : getCourseImage(data.category, data.id);

  // Use real stats when available, fall back to hash-based mock stats
  const rating = courseStats && courseStats.reviewCount > 0
    ? courseStats.averageRating.toFixed(1)
    : (() => {
        const hash = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (4.0 + (hash % 10) / 10).toFixed(1);
      })();
  const numRating = parseFloat(rating);
  const students = courseStats ? courseStats.enrollmentCount : (() => {
    const hash = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Math.floor(100 + (hash % 5000));
  })();
  const ratingCount = courseStats ? courseStats.reviewCount : Math.floor(students / 5);

  const isBestseller = numRating >= 4.6 && students > 500;
  const instructorName = data.user?.name || "Edris Instructor";

  // GSAP Mouse Move Spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const glow = currentTarget.querySelector('.hover-glow') as HTMLDivElement;
    if (glow) {
      gsap.to(glow, {
        x: x - 250, // half of w-[500px]
        y: y - 250,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  };

  return (
    <Link href={isPurchased ? `/dashboard/${data.slug}` : `/courses/${data.slug}`} className="block h-full group/card">
      <div
        onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
        className="relative h-full flex flex-col rounded-3xl border border-border/80 bg-card/40 backdrop-blur-2xl transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>

        {/* Dynamic Interactive Spotlight Glow */}
        <div
          className="hover-glow pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-[60px] mix-blend-screen z-0"
          style={{ transform: 'translate(0px, 0px)' }}
        />

        {/* Static internal gentle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/[0.03] pointer-events-none z-0" />

        {/* Top: Image Section */}
        <div className="p-2 sm:p-3 relative z-10 w-full mb-1">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted/50 border border-border group-hover/card:border-primary/20 transition-colors">
            <Image
              src={courseImage}
              alt={data.title}
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Floating Badges */}
            <div className="absolute top-3 left-3 flex gap-2 z-20">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm border border-white/10">
                {data.category}
              </Badge>
              {isBestseller && (
                <Badge variant="secondary" className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm border-0 animate-pulse">
                  Bestseller
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Content Section */}
        <div className="flex flex-col flex-1 px-5 pb-5 pt-1 relative z-10">

          <div className="mb-auto">
            <h3 className="font-extrabold text-[18px] sm:text-[19px] leading-tight line-clamp-2 text-foreground group-hover/card:text-primary transition-colors duration-300 drop-shadow-sm mb-2">
              {data.title}
            </h3>
            <p className="text-[13px] text-muted-foreground font-semibold flex items-center gap-2">
              <span className="w-6 h-px bg-border group-hover/card:bg-primary/50 transition-colors" /> {instructorName}
            </p>
          </div>

          {/* Rating logic */}
          <div className="flex items-center gap-1.5 mt-4 mb-3">
            <span className="text-sm font-black text-amber-600 dark:text-amber-500">{rating}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(numRating)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-muted text-muted"}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground ml-1">({ratingCount.toLocaleString()})</span>
          </div>

          <div className="h-px w-full bg-border group-hover/card:bg-primary/20 transition-colors duration-500 mb-4" />

          {/* Footer Meta & Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> {data.level || "Beginner"}
            </div>

            <div className="flex items-center gap-2">
              {data.price === 0 ? (
                <span className="text-[22px] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Free</span>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-muted-foreground line-through font-bold opacity-60">
                    ${(data.price * 1.8).toFixed(0)}
                  </span>
                  <span className="text-[22px] font-black text-foreground">${data.price}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-3xl border border-border/50 bg-card/20 p-2 sm:p-3 pb-5">
      <div className="relative aspect-[4/3] w-full mb-4">
        <div className="w-full h-full rounded-2xl bg-muted/60 animate-pulse" />
      </div>
      <div className="px-3 flex flex-col gap-3">
        <div className="h-6 w-full rounded-md bg-muted/60 animate-pulse" />
        <div className="h-6 w-2/3 rounded-md bg-muted/60 animate-pulse" />
        <div className="h-4 w-1/3 rounded-md bg-muted/60 animate-pulse" />
        <div className="flex gap-2 mt-2">
          <div className="h-4 w-16 rounded-md bg-muted/60 animate-pulse" />
          <div className="h-4 w-24 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="h-px w-full bg-border/40 my-2" />
        <div className="flex justify-between items-center">
          <div className="h-6 w-16 rounded-md bg-muted/60 animate-pulse" />
          <div className="h-8 w-20 rounded-md bg-muted/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
