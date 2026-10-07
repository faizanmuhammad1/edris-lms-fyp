import { EnrolledCourseType } from "@/app/data/user/get-enrolled-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCourseProgress, progressLabel } from "./progress-utils";

interface iAppProps {
  data: EnrolledCourseType;
  /** Wide, side-by-side layout used for the "Continue learning" highlight. */
  featured?: boolean;
  /** Heading level for the course title (h2 when the card is not inside a titled section). */
  headingLevel?: "h2" | "h3";
}

export function CourseProgressCard({ data, featured = false, headingLevel = "h3" }: iAppProps) {
  const course = data.Course;
  const thumbnailUrl = useConstructUrl(course.fileKey);
  const { totalLessons, completedLessons, percentage } = getCourseProgress(course);
  const Heading = headingLevel;
  const href = `/dashboard/${course.slug}`;
  const status = progressLabel(percentage);
  const cta = percentage >= 100 ? "Review course" : percentage > 0 ? "Continue learning" : "Start course";

  return (
    <Card
      className={cn(
        "group relative w-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50",
        featured && "md:flex-row"
      )}
    >
      <div
        className={cn(
          "relative aspect-video w-full shrink-0 bg-muted",
          featured && "md:aspect-auto md:min-h-56 md:w-2/5"
        )}
      >
        <Image
          fill
          sizes={featured ? "(min-width: 768px) 40vw, 100vw" : "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"}
          className="object-cover"
          src={thumbnailUrl}
          alt=""
        />
        <Badge className="absolute top-3 right-3" variant="secondary">
          {course.level}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="space-y-2">
          <Heading className={cn("font-semibold leading-snug break-words", featured ? "text-xl" : "text-lg")}>
            {/* Stretched link: the whole card is clickable with a single tab stop. */}
            <Link
              href={href}
              className="line-clamp-2 outline-none after:absolute after:inset-0 after:content-[''] hover:text-primary"
              title={course.title}
            >
              {course.title}
            </Link>
          </Heading>
          {course.smallDescription && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{course.smallDescription}</p>
          )}
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium">
              {percentage >= 100 ? (
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
              {status}
            </span>
            <span className="font-medium tabular-nums">{percentage}%</span>
          </div>
          <Progress
            value={percentage}
            className="h-2"
            aria-label={`${course.title} progress`}
          />
          <p className="text-xs text-muted-foreground">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>

        <span
          aria-hidden="true"
          className={buttonVariants({
            size: "lg",
            className: "pointer-events-none w-full group-hover:bg-primary-hover",
          })}
        >
          {cta}
          <ArrowRight aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
