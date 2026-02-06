"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { motion } from "framer-motion";
import { PublicCourseCard } from "./PublicCourseCard";

interface FeaturedCoursesProps {
    courses: PublicCourseType[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
    // Show up to 8 featured courses
    const featuredCourses = courses.slice(0, 8);

    return (
        <section className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 to-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-500/5 to-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden -z-10">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-primary/20"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <motion.div
                    className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="space-y-3">
                        <Badge
                            variant="outline"
                            className="text-primary border-primary/30 bg-gradient-to-r from-primary/10 to-emerald-500/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium"
                        >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            Top Rated Content
                        </Badge>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                            Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">Courses</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                            Hand-picked courses to help you master new skills. Start learning today.
                        </p>
                    </div>
                    <Link href="/courses">
                        <Button
                            variant="outline"
                            className="group shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 px-6"
                        >
                            View All Courses
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>

                {/* Course Grid */}
                {featuredCourses.length === 0 ? (
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
                        <p className="text-muted-foreground">Check back soon for amazing courses!</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {featuredCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="h-full"
                            >
                                <PublicCourseCard data={course} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* View More CTA */}
                {courses.length > 8 && (
                    <motion.div
                        className="flex justify-center mt-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Link href="/courses">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-xl px-8"
                            >
                                Explore All {courses.length} Courses
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
