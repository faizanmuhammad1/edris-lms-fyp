"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Linkedin, ArrowRight, Award } from "lucide-react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const instructorDefaults = [
    {
        id: 1,
        name: "Faizan Muhammad",
        role: "Lead Developer",
        image: "/faizan.png",
        bio: "Software engineering expert passionate about building scalable, high-performance web applications and systems.",
        linkedin: "https://www.linkedin.com/in/faizanmuhammad2/",
    },
    {
        id: 2,
        name: "Jahanzaib Shaikh",
        role: "Full-Stack Engineer",
        image: "/jahanzaib.png",
        bio: "Dedicated full-stack developer bridging the gap between elegant user interfaces and robust backend architectures.",
        linkedin: "https://www.linkedin.com/in/jahanzaib-shaikh-9a6199215/",
    },
    {
        id: 3,
        name: "Aleena Imran",
        role: "Lead UI/UX Designer",
        image: "/aleena.png",
        bio: "Award-winning designer with a keen eye for detail, crafting intuitive and beautiful digital experiences.",
        linkedin: "https://www.linkedin.com/in/aleena-imran-9a4155282/",
    },
];

function formatStat(value: number): string {
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, '')}K+`;
    return `${value}`;
}

type InstructorStat = {
    name: string;
    totalStudents: number;
    totalCourses: number;
};

type InstructorDisplay = typeof instructorDefaults[0] & {
    students: string;
    courses: number;
};

function InstructorCard({ instructor }: { instructor: InstructorDisplay }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 3D Tilt Effect
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                transformPerspective: 1000,
                ease: "power2.out",
                duration: 0.4
            });

            // Spotlight Effect
            const glow = card.querySelector('.hover-glow') as HTMLDivElement;
            if (glow) {
                gsap.to(glow, {
                    x: x - 200,
                    y: y - 200,
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out"
                });
            }
        };

        const handleMouseLeave = () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                ease: "power3.out",
                duration: 0.6
            });
            const glow = card.querySelector('.hover-glow') as HTMLDivElement;
            if (glow) {
                gsap.to(glow, { opacity: 0, duration: 0.4 });
            }
        };

        card.addEventListener("mousemove", handleMouseMove);
        card.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            card.removeEventListener("mousemove", handleMouseMove);
            card.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <div ref={cardRef} className="gsap-instructor-card group relative h-[500px] w-full rounded-3xl overflow-hidden cursor-pointer will-change-transform">
            {/* Spotlight Glow */}
            <div className="hover-glow pointer-events-none absolute -left-[200px] -top-[200px] z-20 h-[400px] w-[400px] rounded-full bg-primary/20 opacity-0 mix-blend-overlay blur-[50px] transition-opacity duration-300" />

            {/* Background Image with Parallax & Grayscale trick */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={instructor.image}
                    alt={instructor.name}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110 grayscale-[0.8] group-hover:grayscale-0 brightness-90 group-hover:brightness-105"
                />
            </div>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-x-0 bottom-0 z-10 h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500" />

            {/* Decorative Top/Right Gradient */}
            <div className="absolute -top-10 -right-10 z-10 w-32 h-32 bg-primary/40 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Content Container */}
            <div ref={contentRef} className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-8">
                {/* Social Links (Hidden by default, slides down on hover) */}
                <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                    <Link
                        href={instructor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-primary hover:text-primary-foreground transition-colors border border-white/20"
                    >
                        <Linkedin size={18} />
                    </Link>
                </div>

                <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/20 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20">
                            {instructor.role}
                        </span>
                        <span className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white/90 border border-white/10">
                            <Award className="w-3 h-3 mr-1 text-amber-400" /> Top Rated
                        </span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                        {instructor.name}
                    </h3>

                    <div className="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-500 ease-out overflow-hidden delay-100">
                        <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4">
                            {instructor.bio}
                        </p>
                    </div>
                </div>
            </div>

            {/* Outline on hover */}
            <div className="absolute inset-0 z-30 rounded-3xl border-2 border-white/0 group-hover:border-white/20 transition-colors duration-500 pointer-events-none" />
        </div>
    );
}

export function InstructorsSection({ instructorStats }: { instructorStats: InstructorStat[] }) {
    const sectionRef = useRef<HTMLElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Merge real stats into instructor display data
    const instructors: InstructorDisplay[] = instructorDefaults.map((def) => {
        const realStat = instructorStats.find(s => s.name === def.name);
        return {
            ...def,
            students: realStat ? formatStat(realStat.totalStudents) : "0",
            courses: realStat ? realStat.totalCourses : 0,
        };
    });

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
            }
        });

        tl.fromTo(".gsap-instructor-header-badge",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        )
            .fromTo(".gsap-instructor-title",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                "-=0.4"
            )
            .fromTo(".gsap-instructor-desc",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
                "-=0.6"
            );

        // Advanced 3D Entrance for cards
        gsap.fromTo(".gsap-instructor-card",
            {
                y: 100,
                z: -50,
                opacity: 0,
                rotationX: 10
            },
            {
                y: 0,
                z: 0,
                opacity: 1,
                rotationX: 0,
                duration: 1,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: gridRef.current,
                    start: "top 80%",
                }
            }
        );

        gsap.fromTo(".gsap-instructor-cta",
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".gsap-instructor-cta",
                    start: "top 95%",
                }
            }
        );

    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="py-24 md:py-32 bg-background relative overflow-hidden perspective-1000">
            {/* Ambient Background Blur Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[100px]" />
            </div>

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">
                {/* Section Header */}
                <div className="text-center mb-16 md:mb-24 max-w-3xl mx-auto flex flex-col items-center">
                    <div className="gsap-instructor-header-badge inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                        World-Class Mentors
                    </div>
                    <h2 className="gsap-instructor-title text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                        Learn from the {" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative inline-block">
                            best in the industry
                        </span>
                    </h2>
                    <p className="gsap-instructor-desc text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Our instructors aren&apos;t just teachers—they are active professionals who have mastered their craft at top global companies.
                    </p>
                </div>

                {/* Grid */}
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                    {instructors.map((instructor) => (
                        <InstructorCard key={instructor.id} instructor={instructor} />
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="gsap-instructor-cta mt-20 md:mt-28 text-center relative z-20">
                    <div className="inline-flex flex-col items-center p-8 rounded-3xl bg-card border border-border/50 shadow-2xl shadow-primary/5 max-w-2xl mx-auto w-full backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                            <Award size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">Become an Instructor</h3>
                        <p className="text-muted-foreground mb-8 text-lg">
                            Are you an expert in your field? Share your knowledge, build your personal brand, and earn on Edris.
                        </p>
                        <Link
                            href="/teach"
                            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            Start Teaching Today
                            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </section >
    );
}
