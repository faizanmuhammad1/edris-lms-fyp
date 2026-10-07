import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { getAllCourses, getCourseCardStats } from "@/app/data/course/get-all-courses";
import { getCurrentUserActiveEnrollmentCourseIds } from "@/app/data/user/get-current-user-active-enrollment-course-ids";
import { EmptyState } from "@/components/general/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PublicCourseCard, PublicCourseCardSkeleton } from "../_components/PublicCourseCard";
import { containerClass } from "../_components/SectionHeading";
import { pageMetadata } from "../_lib/seo";
import { CategoriesBar } from "./_components/CategoriesBar";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = firstParam(params.category)?.trim() || undefined;
  const search = firstParam(params.search)?.trim().slice(0, 100) || undefined;

  if (search) {
    // Search result pages are thin/duplicate content: keep them out of the index.
    return pageMetadata({
      title: `Search results for “${search.slice(0, 60)}”`,
      description: `Courses on Edris LMS matching “${search.slice(0, 60)}”.`,
      path: "/courses",
      noindex: true,
    });
  }

  if (category) {
    return pageMetadata({
      title: `${category} courses`,
      description: `Browse ${category.toLowerCase()} courses on Edris LMS — expert-led video lessons, an AI tutor and blockchain-verified certificates.`,
      path: `/courses?category=${encodeURIComponent(category)}`,
    });
  }

  return pageMetadata({
    title: "Browse all courses",
    description:
      "Explore every course on Edris LMS: development, business, design, marketing and more, with an AI tutor and verified certificates.",
    path: "/courses",
  });
}

export default async function PublicCoursesRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = firstParam(params.category)?.trim() || undefined;
  const search = firstParam(params.search)?.trim().slice(0, 100) || undefined;

  const heading = search
    ? `Results for “${search}”`
    : category
      ? `${category} courses`
      : "Explore all courses";
  const description = search
    ? category
      ? `Searching within ${category}.`
      : "Courses whose title, summary or category match your search."
    : category
      ? `Discover ${category.toLowerCase()} courses designed to help you master new skills.`
      : "Discover courses designed to help you reach your learning goals.";

  return (
    <div className="bg-background">
      {/* Page header */}
      <div className="border-b bg-muted/30">
        <div className={`${containerClass} py-10 sm:py-14`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <h1 className="break-words text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                {heading}
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">{description}</p>
            </div>

            <form role="search" action="/courses" method="get" className="flex w-full gap-2 lg:max-w-sm">
              {category && <input type="hidden" name="category" value={category} />}
              <label htmlFor="catalog-search" className="sr-only">
                Search courses
              </label>
              <Input
                id="catalog-search"
                name="search"
                type="search"
                defaultValue={search}
                maxLength={100}
                autoComplete="off"
                placeholder={category ? `Search ${category}` : "Search courses"}
                className="h-11 bg-background"
              />
              <Button type="submit" className="h-11 shrink-0 px-4">
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      <CategoriesBar activeCategory={category ?? null} />

      <div className={`${containerClass} py-10 sm:py-12`}>
        <Suspense key={`${category ?? ""}|${search ?? ""}`} fallback={<LoadingSkeletonLayout />}>
          <RenderCourses category={category} search={search} />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderCourses({ category, search }: { category?: string; search?: string }) {
  const [courses, activeEnrollmentCourseIds] = await Promise.all([
    getAllCourses(category, search),
    getCurrentUserActiveEnrollmentCourseIds(),
  ]);
  const activeEnrollmentSet = new Set(activeEnrollmentCourseIds);
  const courseStats = await getCourseCardStats(courses.map((course) => course.id));

  if (courses.length === 0) {
    const resetHref = search && category ? `/courses?category=${encodeURIComponent(category)}` : "/courses";
    return (
      <EmptyState
        icon={SearchX}
        title={search ? "No courses match your search" : "No courses here yet"}
        description={
          search
            ? `We couldn't find courses matching “${search}”${category ? ` in ${category}` : ""}. Try a different keyword or browse all courses.`
            : category
              ? `There are no ${category} courses available right now. Check back soon or explore other categories.`
              : "No courses are available at the moment. Check back soon!"
        }
        action={
          search || category ? (
            <>
              <Link href={resetHref} className={buttonVariants({ className: "h-10" })}>
                {search ? "Clear search" : "View all courses"}
              </Link>
              {search && category && (
                <Link href="/courses" className={buttonVariants({ variant: "outline", className: "h-10" })}>
                  Browse all courses
                </Link>
              )}
            </>
          ) : undefined
        }
      />
    );
  }

  return (
    <section aria-labelledby="results-heading">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="results-heading" className="text-base font-medium text-muted-foreground" aria-live="polite">
          {courses.length} course{courses.length === 1 ? "" : "s"}
          {search ? ` matching “${search}”` : ""}
          {category ? ` in ${category}` : ""}
        </h2>
        {(search || category) && (
          <Link href="/courses" className="inline-flex min-h-8 items-center text-sm font-medium text-primary hover:underline">
            Clear filters
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <li key={course.id} className="min-w-0">
            <PublicCourseCard
              data={course}
              isPurchased={activeEnrollmentSet.has(course.id)}
              courseStats={courseStats[course.id]}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div role="status" aria-label="Loading courses">
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <PublicCourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
