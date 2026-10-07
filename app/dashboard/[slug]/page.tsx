import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, BarChart, Award, PlayCircle, RotateCcw } from "lucide-react";
import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { isCourseFullyComplete } from "@/app/data/course/is-course-fully-complete";
import { requireUser } from "@/app/data/user/require-user";
import { getCourseReviews } from "@/app/actions/reviews";
import { PageHeader } from "@/components/general/PageHeader";
import { ReviewForm } from "@/components/general/ReviewForm";
import { ReviewList } from "@/components/general/ReviewList";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "../_components/PageContainer";
import { getCourseProgress, getNextLesson } from "../_components/progress-utils";

interface iAppProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: iAppProps): Promise<Metadata> {
  const { slug } = await params;
  const { course } = await getCourseSidebarData(slug);
  return { title: course.title };
}

function parseDescription(description: string | null) {
  if (!description) return null;
  try {
    return JSON.parse(description);
  } catch {
    return null;
  }
}

export default async function CourseSlugRoute({ params }: iAppProps) {
  const { slug } = await params;
  const { course } = await getCourseSidebarData(slug);
  const [reviews, user] = await Promise.all([getCourseReviews(course.id), requireUser()]);
  const fullyComplete = await isCourseFullyComplete(course.id, user.id);

  const { totalLessons, completedLessons, percentage } = getCourseProgress(course);
  const nextLesson = getNextLesson(course);
  const description = parseDescription(course.description);

  const ctaLabel =
    percentage >= 100 ? "Review lessons" : completedLessons > 0 ? "Continue learning" : "Start course";

  return (
    <PageContainer width="medium">
      <PageHeader
        title={<span className="break-words">{course.title}</span>}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {course.duration} {course.duration === 1 ? "hour" : "hours"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BarChart className="size-4" aria-hidden="true" />
              {course.level}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-4" aria-hidden="true" />
              {course.category}
            </span>
          </span>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Your progress</span>
              <span className="text-muted-foreground tabular-nums">
                {completedLessons} of {totalLessons} lessons · {percentage}%
              </span>
            </div>
            <Progress value={percentage} aria-label="Course progress" />
            {nextLesson && percentage < 100 && (
              <p className="text-sm break-words text-muted-foreground">
                Up next: <span className="font-medium text-foreground">{nextLesson.title}</span>
              </p>
            )}
          </div>
          {nextLesson ? (
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href={`/dashboard/${course.slug}/${nextLesson.id}`}>
                {percentage >= 100 ? <RotateCcw aria-hidden="true" /> : <PlayCircle aria-hidden="true" />}
                {ctaLabel}
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Lessons will appear here once they&apos;re published.</p>
          )}
        </CardContent>
      </Card>

      {fullyComplete && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Certificate of completion</h2>
            </CardTitle>
            <CardDescription>
              You&apos;ve completed every lesson in this course. View your blockchain-verified certificate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href={`/dashboard/certificate/${slug}`}>View certificate</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="about-heading" className="space-y-4">
        <h2 id="about-heading" className="text-xl font-semibold tracking-tight">
          About this course
        </h2>
        {description ? (
          <div className="max-w-none break-words">
            <RenderDescription json={description} />
          </div>
        ) : (
          <p className="text-muted-foreground">No description has been added for this course yet.</p>
        )}
      </section>

      <Separator />

      <section aria-labelledby="reviews-heading" className="space-y-6">
        <h2 id="reviews-heading" className="text-xl font-semibold tracking-tight">
          Student reviews{reviews.length > 0 && <span className="text-muted-foreground"> ({reviews.length})</span>}
        </h2>
        <ReviewForm courseId={course.id} />
        <ReviewList reviews={reviews} />
      </section>
    </PageContainer>
  );
}
