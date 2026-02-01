import { getIndividualCourse } from "@/app/data/course/get-course";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  IconBook,
  IconCategory,
  IconChartBar,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
  IconCalendar,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";
import { checkIfCourseBought } from "@/app/data/user/user-is-enrolled";
import Link from "next/link";
import { EnrollmentButton } from "./_components/EnrollmentButton";
import { buttonVariants } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { VideoPreviewPlayer } from "./_components/VideoPreviewPlayer";
import { CourseRatingInline } from "./_components/CourseRatingDisplay";
import { InstructorCard, InstructorInline } from "./_components/InstructorCard";
import { StudentReviews } from "./_components/StudentReviews";
import { formatDistanceToNow } from "date-fns";

type Params = Promise<{ slug: string }>;

export default async function SlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getIndividualCourse(slug);
  const isEnrolled = await checkIfCourseBought(course.id);

  const totalLessons = course.chapter.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section with Video Preview */}
      <section className="relative py-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <VideoPreviewPlayer
              thumbnailKey={course.previewThumbnailKey}
              videoKey={course.previewVideoKey}
              title={course.title}
            />

            {/* Course Title & Meta */}
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                {course.title}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.smallDescription}
              </p>

              {/* Rating & Stats Bar */}
              <div className="flex flex-wrap items-center gap-4">
                <CourseRatingInline
                  avgRating={course.avgRating}
                  reviewCount={course.reviewCount}
                  studentCount={course.studentCount}
                />

                {course.updatedAt && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    <span>
                      Updated {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>

              {/* Instructor */}
              <InstructorInline instructor={course.user} />

              {/* Badges */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge className="flex items-center gap-1.5 px-3 py-1.5">
                  <IconChartBar className="size-4" />
                  <span>{course.level}</span>
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
                  <IconCategory className="size-4" />
                  <span>{course.category}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                  <IconClock className="size-4" />
                  <span>{course.duration} hours</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Sticky Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <Card className="border-2 shadow-xl">
                <CardContent className="p-6 space-y-6">
                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold text-primary">
                        {course.price === 0 ? (
                          "Free"
                        ) : (
                          new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(course.price)
                        )}
                      </span>
                      {course.price > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          ${(course.price * 1.5).toFixed(0)}
                        </span>
                      )}
                    </div>
                    {course.price > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        33% off
                      </Badge>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  {isEnrolled ? (
                    <Link
                      className={buttonVariants({ className: "w-full", size: "lg" })}
                      href={`/dashboard/${course.slug}`}
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <div className="space-y-3">
                      <EnrollmentButton courseId={course.id} />
                      <AddToCartButton courseId={course.id} />
                    </div>
                  )}

                  <p className="text-center text-xs text-muted-foreground">
                    30-day money-back guarantee
                  </p>

                  <Separator />

                  {/* What's Included */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">This course includes:</h4>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                          <IconClock className="size-3.5" />
                        </div>
                        <span>{course.duration} hours of video content</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                          <IconBook className="size-3.5" />
                        </div>
                        <span>{totalLessons} lessons</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="rounded-full p-1 bg-green-500/10 text-green-600 shrink-0">
                          <CheckIcon className="size-4" />
                        </div>
                        <span>Full lifetime access</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="rounded-full p-1 bg-green-500/10 text-green-600 shrink-0">
                          <CheckIcon className="size-4" />
                        </div>
                        <span>Access on mobile and desktop</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="rounded-full p-1 bg-green-500/10 text-green-600 shrink-0">
                          <CheckIcon className="size-4" />
                        </div>
                        <span>Certificate of completion</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Course Description */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">
              About this course
            </h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <RenderDescription json={JSON.parse(course.description)} />
            </div>
          </div>

          <Separator />

          {/* Course Content Accordion */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">
                Course Content
              </h2>
              <span className="text-sm text-muted-foreground">
                {course.chapter.length} chapters • {totalLessons} lessons
              </span>
            </div>

            <div className="space-y-3">
              {course.chapter.map((chapter, index) => (
                <Collapsible key={chapter.id} defaultOpen={index === 0}>
                  <Card className="p-0 overflow-hidden border transition-all duration-200 hover:shadow-md">
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold">{chapter.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {chapter.lessons.length} lesson
                                {chapter.lessons.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <IconChevronDown className="size-5 text-muted-foreground transition-transform duration-200" />
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20 p-4 space-y-2">
                        {chapter.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
                              <IconPlayerPlay className="size-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Lesson {lessonIndex + 1}
                              </p>
                            </div>
                            {lesson.videoKey && (
                              <Badge variant="outline" className="text-xs">
                                Video
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>

          <Separator />

          {/* Instructor Section */}
          <InstructorCard
            instructor={course.user}
            totalStudents={course.studentCount}
          />

          {/* Reviews Section */}
          {course.reviews.length > 0 && (
            <>
              <Separator />
              <StudentReviews
                reviews={course.reviews}
                avgRating={course.avgRating}
                reviewCount={course.reviewCount}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
