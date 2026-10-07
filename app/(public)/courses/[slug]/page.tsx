import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  IconBook,
  IconCalendar,
  IconCategory,
  IconCertificate,
  IconChartBar,
  IconChevronDown,
  IconClock,
  IconDeviceMobile,
  IconInfinity,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";
import { getIndividualCourse } from "@/app/data/course/get-course";
import { checkIfCourseBought } from "@/app/data/user/user-is-enrolled";
import { getPublicFileUrl } from "@/lib/file-url";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { containerClass } from "../../_components/SectionHeading";
import { SITE_NAME, absoluteUrl, jsonLd, pageMetadata, siteUrl, truncate } from "../../_lib/seo";
import { CourseDescription } from "./_components/CourseDescription";
import { EnrollmentButton } from "./_components/EnrollmentButton";
import { VideoPreviewPlayer } from "./_components/VideoPreviewPlayer";
import { CourseRatingInline } from "./_components/CourseRatingDisplay";
import { InstructorCard, InstructorInline } from "./_components/InstructorCard";
import { StudentReviews } from "./_components/StudentReviews";

type Params = Promise<{ slug: string }>;

// Dedupe the course lookup between generateMetadata and the page within one request.
const getCourse = cache(getIndividualCourse);

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Public URL for a stored image key, or null for mock/placeholder keys. */
function imageUrlFromKey(key: string | null | undefined): string | null {
  if (!key || key.startsWith("thumbnails/")) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return getPublicFileUrl(key);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  const image = imageUrlFromKey(course.fileKey) ?? imageUrlFromKey(course.previewThumbnailKey);

  return pageMetadata({
    title: course.title,
    description: truncate(course.smallDescription || `Learn ${course.title} on Edris LMS.`),
    path: `/courses/${course.slug}`,
    image: image ? { url: image, alt: course.title } : null,
    // Draft/archived previews (teacher/admin only) must never be indexed.
    noindex: course.status !== "Published",
  });
}

export default async function SlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  const isEnrolled = await checkIfCourseBought(course.id);

  const totalLessons = course.chapter.reduce((total, chapter) => total + chapter.lessons.length, 0);
  const priceLabel = course.price === 0 ? "Free" : currency.format(course.price);
  const courseUrl = absoluteUrl(`/courses/${course.slug}`);
  const image = imageUrlFromKey(course.fileKey) ?? imageUrlFromKey(course.previewThumbnailKey);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: truncate(course.smallDescription || course.title, 500),
    url: courseUrl,
    ...(image ? { image } : {}),
    inLanguage: "en",
    educationalLevel: course.level,
    about: course.category,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
    ...(course.user?.name
      ? { instructor: { "@type": "Person", name: course.user.name } }
      : {}),
    offers: {
      "@type": "Offer",
      price: course.price,
      priceCurrency: "USD",
      category: course.price === 0 ? "Free" : "Paid",
      availability: "https://schema.org/InStock",
      url: courseUrl,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      ...(course.duration > 0 ? { courseWorkload: `PT${course.duration}H` } : {}),
    },
    ...(course.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: course.avgRating,
            reviewCount: course.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const includes = [
    { icon: IconClock, label: `${course.duration} hours of video content` },
    { icon: IconBook, label: `${totalLessons} lesson${totalLessons === 1 ? "" : "s"}` },
    { icon: IconInfinity, label: "Full lifetime access" },
    { icon: IconDeviceMobile, label: "Access on mobile and desktop" },
    { icon: IconCertificate, label: "Certificate of completion" },
  ];

  return (
    <div className="bg-background">
      {course.status === "Published" && (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      )}

      <div className={`${containerClass} py-6 sm:py-8 lg:py-10`}>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="inline-flex min-h-8 items-center">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/courses" className="inline-flex min-h-8 items-center">
                  Courses
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="line-clamp-1 break-words">{course.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Course header */}
          <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
            <div className="overflow-hidden rounded-2xl border">
              <VideoPreviewPlayer
                thumbnailKey={course.previewThumbnailKey}
                videoKey={course.previewVideoKey}
                title={course.title}
                muxStreamUrl={course.muxStreamUrl}
                muxThumbnailUrl={course.muxThumbnailUrl}
              />
            </div>

            <div className="space-y-4">
              <h1 className="break-words text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {course.title}
              </h1>
              {course.smallDescription && (
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{course.smallDescription}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <CourseRatingInline
                  avgRating={course.avgRating}
                  reviewCount={course.reviewCount}
                  studentCount={course.studentCount}
                />
                {course.updatedAt && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <IconCalendar className="size-4" aria-hidden="true" />
                    Updated {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true })}
                  </span>
                )}
              </div>

              <InstructorInline instructor={course.user} />

              <ul className="flex flex-wrap gap-2 pt-1" aria-label="Course details">
                <li>
                  <Badge variant="outline" className="gap-1.5 border-primary/25 bg-primary/5 px-3 py-1.5 text-sm text-primary">
                    <IconChartBar aria-hidden="true" />
                    {course.level}
                  </Badge>
                </li>
                <li>
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                    <IconCategory aria-hidden="true" />
                    {course.category}
                  </Badge>
                </li>
                <li>
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                    <IconClock aria-hidden="true" />
                    {course.duration} hours
                  </Badge>
                </li>
              </ul>
            </div>
          </div>

          {/* Enrollment card: stacks under the header on mobile, sticky sidebar on lg+ */}
          <aside aria-label="Enroll in this course" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <Card className="gap-0 py-0 shadow-md">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    <span className="sr-only">Price: </span>
                    {priceLabel}
                  </p>

                  {isEnrolled ? (
                    <Link
                      className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}
                      href={`/dashboard/${course.slug}`}
                    >
                      Continue learning
                    </Link>
                  ) : (
                    <div className="space-y-3">
                      <EnrollmentButton courseId={course.id} />
                      <AddToCartButton courseId={course.id} />
                    </div>
                  )}

                  <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <CheckIcon className="size-4 text-primary" aria-hidden="true" />
                    Secure checkout powered by Stripe
                  </p>

                  <div className="border-t pt-5">
                    <h2 className="text-base font-semibold">This course includes</h2>
                    <ul className="mt-4 space-y-3">
                      {includes.map((item) => (
                        <li key={item.label} className="flex items-center gap-3 text-sm">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <item.icon className="size-4" aria-hidden="true" />
                          </span>
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Course details */}
          <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-2">
            <section aria-labelledby="about-heading" className="space-y-4">
              <h2 id="about-heading" className="text-2xl font-semibold tracking-tight">
                About this course
              </h2>
              <div className="prose prose-neutral max-w-none break-words dark:prose-invert">
                <CourseDescription json={course.description} fallback={course.smallDescription} />
              </div>
            </section>

            <section aria-labelledby="content-heading" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="content-heading" className="text-2xl font-semibold tracking-tight">
                  Course content
                </h2>
                <p className="text-sm text-muted-foreground">
                  {course.chapter.length} chapter{course.chapter.length === 1 ? "" : "s"} · {totalLessons} lesson
                  {totalLessons === 1 ? "" : "s"}
                </p>
              </div>

              {course.chapter.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  The curriculum for this course is being prepared.
                </p>
              ) : (
                <div className="divide-y overflow-hidden rounded-xl border">
                  {course.chapter.map((chapter, index) => (
                    <details key={chapter.id} open={index === 0} className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:gap-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary sm:size-10">
                          {index + 1}
                        </span>
                        <h3 className="min-w-0 flex-1">
                          <span className="block break-words font-semibold text-foreground">{chapter.title}</span>
                          <span className="block text-sm font-normal text-muted-foreground">
                            {chapter.lessons.length} lesson{chapter.lessons.length === 1 ? "" : "s"}
                          </span>
                        </h3>
                        <IconChevronDown
                          className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>
                      <div>
                        <ol className="space-y-1 border-t bg-muted/20 p-2 sm:p-3">
                          {chapter.lessons.map((lesson, lessonIndex) => (
                            <li key={lesson.id} className="flex items-center gap-3 rounded-lg p-2 sm:p-3">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                                <IconPlayerPlay className="size-3.5 text-muted-foreground" aria-hidden="true" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block break-words text-sm font-medium">{lesson.title}</span>
                                <span className="block text-xs text-muted-foreground">Lesson {lessonIndex + 1}</span>
                              </span>
                              {lesson.videoKey && (
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  Video
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>

            <InstructorCard instructor={course.user} totalStudents={course.studentCount} />

            {course.reviews.length > 0 && (
              <StudentReviews
                reviews={course.reviews}
                avgRating={course.avgRating}
                reviewCount={course.reviewCount}
                ratingCounts={course.ratingCounts}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
