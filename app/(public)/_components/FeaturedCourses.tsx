"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { motion } from "framer-motion";

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
                            >
                                <Link href={`/courses/${course.slug}`}>
                                    <Card className="group relative h-full overflow-hidden border-border/50 bg-gradient-to-b from-card to-card/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 flex flex-col">
                                        {/* Course Image */}
                                        <div className="relative aspect-video overflow-hidden">
                                            <Image
                                                src={course.fileKey
                                                    ? `${process.env.NEXT_PUBLIC_S3_DEV_URL}/${course.fileKey}`
                                                    : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                                                }
                                                alt={course.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                                            {/* Category Badge */}
                                            {course.category && (
                                                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-primary to-emerald-500 text-white border-none shadow-lg font-medium px-3 py-1 text-xs">
                                                    {course.category}
                                                </Badge>
                                            )}

                                            {/* Hover Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                                                    <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
                                                </div>
                                            </div>
                                        </div>

                                        <CardContent className="p-5 flex-1 flex flex-col gap-3">
                                            {/* Course Meta */}
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                                                    <Clock className="w-3 h-3" />
                                                    {course.duration}h
                                                </span>
                                                <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                                                    {course.level}
                                                </span>
                                            </div>

                                            {/* Course Title */}
                                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
                                                {course.title}
                                            </h3>

                                            {/* Course Description */}
                                            {course.smallDescription && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {course.smallDescription}
                                                </p>
                                            )}

                                            {/* Price & CTA */}
                                            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                                                        {course.price === 0 ? (
                                                            "Free"
                                                        ) : (
                                                            `$${course.price}`
                                                        )}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-md group-hover:shadow-lg transition-all"
                                                >
                                                    Enroll
                                                    <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
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
