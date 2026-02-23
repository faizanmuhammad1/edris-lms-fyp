"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Facebook, Twitter, Linkedin, ArrowRight, Award } from "lucide-react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const instructors = [
    {
        id: 1,
        name: "Dr. Ali Rehman",
        role: "Lead Data Scientist",
        image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=800&auto=format&fit=crop", // Professional South Asian man
        bio: "Former Head of Data at TechCorp. passionate about making complex ML algorithms accessible to everyone.",
        students: "45K+",
        courses: 8,
    },
    {
        id: 2,
        name: "Zoya Ahmed",
        role: "Senior UI/UX Designer",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop", // Professional South Asian woman
        bio: "Award-winning designer with 10+ years experience building interfaces for Fortune 500 companies.",
        students: "32K+",
        courses: 5,
    },
    {
        id: 3,
        name: "Bilal Hussain",
        role: "Full-Stack Developer",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop", // Professional South Asian man
        bio: "Open-source contributor and cloud architecture expert. Teaching modern web dev from zero to mastery.",
        students: "89K+",
        courses: 12,
    },
    {
        id: 4,
        name: "Fatima Noor",
        role: "Financial Analyst",
        image: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=800&auto=format&fit=crop", // Professional South Asian woman
        bio: "CFA charterholder breaking down Wall Street valuation models for everyday investors and founders.",
        students: "21K+",
        courses: 4,
    },
];

function InstructorCard({ instructor }: { instructor: typeof instructors[0] }) {
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
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-primary hover:text-primary-foreground transition-colors border border-white/20">
                        <Twitter size={18} />
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-primary hover:text-primary-foreground transition-colors border border-white/20">
                        <Linkedin size={18} />
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-primary hover:text-primary-foreground transition-colors border border-white/20">
                        <Facebook size={18} />
                    </button>
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

                        <div className="flex items-center gap-6 pt-4 border-t border-white/20 text-sm font-medium text-white/90">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                {instructor.students} Students
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                {instructor.courses} Courses
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Outline on hover */}
            <div className="absolute inset-0 z-30 rounded-3xl border-2 border-white/0 group-hover:border-white/20 transition-colors duration-500 pointer-events-none" />
        </div>
    );
}

export function InstructorsSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

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
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative">
                            best in the industry
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </span>
                    </h2>
                    <p className="gsap-instructor-desc text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Our instructors aren&apos;t just teachers—they are active professionals who have mastered their craft at top global companies.
                    </p>
                </div>

                {/* Grid */}
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
                            href="/auth/register"
                            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            Start Teaching Today
                            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
