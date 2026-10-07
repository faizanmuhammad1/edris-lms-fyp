import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/general/EmptyState";
import type { PublicCourseType } from "@/app/data/course/get-all-courses";
import type { LandingStats } from "@/app/data/landing/get-landing-stats";
import { PublicCourseCard } from "./PublicCourseCard";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

interface FeaturedCoursesProps {
    courses: PublicCourseType[];
    courseStats: LandingStats["courseStats"];
}

export function FeaturedCourses({ courses, courseStats }: FeaturedCoursesProps) {
    const featuredCourses = courses.slice(0, 8);

    return (
        <section aria-labelledby="featured-heading" className={`border-y bg-muted/30 ${sectionClass}`}>
            <div className={containerClass}>
                <SectionHeading
                    id="featured-heading"
                    eyebrow="Featured"
                    title="Popular courses"
                    description="Start learning today with courses from our instructors."
                    actions={
                        courses.length > 0 ? (
                            <Link href="/courses" className={buttonVariants({ variant: "outline", className: "h-10" })}>
                                View all courses
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ) : undefined
                    }
                />

                {featuredCourses.length === 0 ? (
                    <EmptyState
                        className="mt-10 bg-card"
                        titleAs="h3"
                        icon={BookOpen}
                        title="No courses yet"
                        description="New courses are on the way. Check back soon."
                    />
                ) : (
                    <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {featuredCourses.map((course) => (
                            <li key={course.id} className="min-w-0">
                                <PublicCourseCard data={course} courseStats={courseStats[course.id]} headingLevel="h3" />
                            </li>
                        ))}
                    </ul>
                )}

                {courses.length > 8 && (
                    <div className="mt-12 flex justify-center">
                        <Link href="/courses" className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}>
                            Explore all {courses.length} courses
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
