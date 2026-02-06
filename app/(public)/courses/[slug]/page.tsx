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
  IconCertificate,
  IconDeviceMobile,
  IconInfinity,
} from "@tabler/icons-react";
import { CheckIcon, ChevronRight } from "lucide-react";
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

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getIndividualCourse(slug);

  return {
    title: course.title,
    description: course.smallDescription,
    openGraph: {
      title: course.title,
      description: course.smallDescription,
      images: [
        {
          url: course.previewThumbnailKey
            ? `https://edris-lms-fyp.fly.storage.tigris.dev/${course.previewThumbnailKey}`
            : "",
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
    },
  };
}

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
      {/* Container wrapper for consistent spacing */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 overflow-hidden rounded-xl border bg-background/50 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/courses" className="hover:text-primary transition-colors">Courses</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium line-clamp-1">{course.title}</span>
        </nav>

        {/* Hero Section with Video Preview */}
        <section className="relative py-8 lg:py-12">


          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Preview */}
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50">
                <VideoPreviewPlayer
                  thumbnailKey={course.previewThumbnailKey}
                  videoKey={course.previewVideoKey}
                  title={course.title}
                />
              </div>

              {/* Course Title & Meta */}
              <div className="space-y-5">
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
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
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
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
                  <Badge className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/20 hover:from-primary/20 hover:to-primary/10 transition-all">
                    <IconChartBar className="size-4" />
                    <span className="font-medium">{course.level}</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1.5 px-4 py-2">
                    <IconCategory className="size-4" />
                    <span>{course.category}</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5 px-4 py-2">
                    <IconClock className="size-4" />
                    <span>{course.duration} hours</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sticky Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <Card className="border-2 border-border/10 shadow-xl bg-card overflow-hidden">
                  {/* Decorative Top Bar Removed */}

                  <CardContent className="p-6 space-y-6">
                    {/* Price */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-4xl font-bold text-foreground">
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
                          <span className="ml-3 text-lg text-muted-foreground line-through">
                            ${(course.price * 1.5).toFixed(0)}
                          </span>
                        )}
                      </div>
                      {course.price > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground border-none shadow-sm text-sm px-3 py-1">
                          33% off
                        </Badge>
                      )}
                    </div>

                    {/* CTA Buttons */}
                    {isEnrolled ? (
                      <Link
                        className={buttonVariants({
                          className: "w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg text-lg h-14",
                          size: "lg"
                        })}
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

                    <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      30-day money-back guarantee
                    </p>

                    <Separator />

                    {/* What's Included */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg">This course includes:</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm group">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shrink-0 group-hover:scale-110 transition-transform">
                            <IconClock className="size-4" />
                          </div>
                          <span>{course.duration} hours of video content</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm group">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shrink-0 group-hover:scale-110 transition-transform">
                            <IconBook className="size-4" />
                          </div>
                          <span>{totalLessons} lessons</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm group">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                            <IconInfinity className="size-4" />
                          </div>
                          <span>Full lifetime access</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm group">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                            <IconDeviceMobile className="size-4" />
                          </div>
                          <span>Access on mobile and desktop</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm group">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                            <IconCertificate className="size-4" />
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
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full" />
                About this course
              </h2>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <RenderDescription json={JSON.parse(course.description)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Course Content Accordion */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full" />
                  Course Content
                </h2>
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  {course.chapter.length} chapters • {totalLessons} lessons
                </Badge>
              </div>

              <div className="space-y-3">
                {course.chapter.map((chapter, index) => (
                  <Collapsible key={chapter.id} defaultOpen={index === 0}>
                    <Card className="p-0 overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-lg">
                                {index + 1}
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg">{chapter.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {chapter.lessons.length} lesson
                                  {chapter.lessons.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <IconChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-2">
                          {chapter.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-4 rounded-xl p-3 hover:bg-background/80 transition-all duration-200 group"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-primary/20 group-hover:border-primary/50 group-hover:scale-105 transition-all">
                                <IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm group-hover:text-primary transition-colors">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Lesson {lessonIndex + 1}
                                </p>
                              </div>
                              {lesson.videoKey && (
                                <Badge variant="outline" className="text-xs border-primary/20">
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
    </div>
  );
}
