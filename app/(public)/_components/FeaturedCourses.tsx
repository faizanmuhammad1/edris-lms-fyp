"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { motion } from "framer-motion";
import { PublicCourseCard } from "./PublicCourseCard";

interface FeaturedCoursesProps {
    courses: PublicCourseType[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
    const featuredCourses = courses.slice(0, 8);

    return (
        <section className="relative py-20 md:py-28 bg-background overflow-hidden">
            {/* Subtle ambient glow */}
            <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] bg-primary/[0.03] rounded-full blur-[120px]" />

            <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                            Featured
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            Popular{" "}
                            <span className="text-primary">Courses</span>
                        </h2>
                        <p className="mt-3 text-muted-foreground text-lg max-w-xl">
                            Hand-picked by our team to help you get started. New courses added every week.
                        </p>
                    </div>
                    <Link href="/courses">
                        <Button
                            variant="outline"
                            className="group shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                        >
                            View All Courses
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>

                {/* Course Grid */}
                {featuredCourses.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold mb-2 text-foreground">No Courses Yet</h3>
                        <p className="text-muted-foreground">Check back soon for new courses.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {featuredCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                className="h-full"
                            >
                                <PublicCourseCard data={course} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* View More */}
                {courses.length > 8 && (
                    <motion.div
                        className="flex justify-center mt-12"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <Link href="/courses">
                            <Button
                                size="lg"
                                className="group px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25"
                            >
                                Explore All {courses.length} Courses
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
