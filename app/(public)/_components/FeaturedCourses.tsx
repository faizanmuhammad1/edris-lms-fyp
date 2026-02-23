"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PublicCourseType } from "@/app/data/course/get-all-courses";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { PublicCourseCard } from "./PublicCourseCard";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface FeaturedCoursesProps {
    courses: PublicCourseType[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
    const featuredCourses = courses.slice(0, 8);
    const sectionRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
            }
        });

        // Intro Text Header Sequence
        tl.from(".gsap-featured-header-text", {
            y: 50,
            opacity: 0,
            rotationX: -20,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.2)",
            transformOrigin: "bottom center"
        });

        tl.from(".gsap-featured-btn-top", {
            scale: 0.9,
            opacity: 0,
            duration: 0.6,
            ease: "back.out(1.5)",
        }, "-=0.4");

        // 3D Staggered Cards Reveal
        tl.from(".gsap-featured-card", {
            y: 80,
            z: -100,
            rotationX: -15,
            rotationY: 10,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
        }, "-=0.2");

        gsap.from(".gsap-featured-btn-bottom", {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".gsap-featured-btn-bottom",
                start: "top 95%",
            }
        });
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="relative py-24 md:py-32 bg-background overflow-hidden perspective-1000">
            {/* Dramatic Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-40 right-[-10%] h-[600px] w-[600px] bg-primary/[0.04] rounded-full blur-[150px]" />
            <div className="pointer-events-none absolute bottom-10 left-[-10%] h-[500px] w-[500px] bg-accent/[0.03] rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay pointer-events-none z-0" />

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">
                {/* Section Header */}
                <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div className="max-w-2xl" style={{ perspective: '1000px' }}>
                        <p className="gsap-featured-header-text inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-4 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Featured
                        </p>
                        <h2 className="gsap-featured-header-text text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                            Popular <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative inline-block">Courses<svg className="absolute -bottom-1 w-full left-0 text-primary/30" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,10 Q50,20 100,5" stroke="currentColor" fill="none" strokeWidth="6" strokeLinecap="round" /></svg></span>
                        </h2>
                        <p className="gsap-featured-header-text mt-4 text-muted-foreground text-lg font-medium leading-relaxed">
                            Start learning today with courses carefully hand-picked by our curated team of experts.
                        </p>
                    </div>
                    <Link href="/courses" className="gsap-featured-btn-top">
                        <Button
                            variant="outline"
                            className="group shrink-0 h-12 px-6 rounded-full border-primary/30 hover:bg-primary/5 hover:text-primary hover:border-primary/60 transition-all duration-300 font-bold bg-card backdrop-blur-md shadow-sm"
                        >
                            View All Courses
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                {/* Course Grid */}
                {featuredCourses.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 rounded-3xl border border-border backdrop-blur-sm">
                        <h3 className="text-xl font-bold mb-2 text-foreground">No Courses Yet</h3>
                        <p className="text-muted-foreground font-medium">Check back soon for new courses.</p>
                    </div>
                ) : (
                    <div className="gsap-featured-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10 min-h-[400px]">
                        {featuredCourses.map((course) => (
                            <div key={course.id} className="gsap-featured-card h-full" style={{ transformStyle: 'preserve-3d' }}>
                                <PublicCourseCard data={course} />
                            </div>
                        ))}
                    </div>
                )}

                {/* View More Bottom */}
                {courses.length > 8 && (
                    <div className="gsap-featured-btn-bottom flex justify-center mt-16 relative z-20">
                        <Link href="/courses">
                            <Button
                                size="lg"
                                className="group h-14 px-10 rounded-full font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 bg-primary text-primary-foreground text-lg"
                            >
                                Explore All {courses.length} Courses
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
