"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Quote, Star } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const testimonials = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Software Engineer @ TechFlow",
        content: "The AI assistant is a game changer. I ask questions about the video content in real-time and get clear explanations &mdash; it&apos;s like having a tutor on call.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop",
        positionClass: "md:absolute md:top-[12%] md:left-[8%]",
        sizeClass: "w-16 h-16 md:w-28 md:h-28",
        rating: 5,
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Data Scientist @ Quantum",
        content: "I love the blockchain-verified certificates. It gives me something concrete to show employers, and they can verify it instantly. Really sets Edris apart.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
        positionClass: "md:absolute md:bottom-[20%] md:left-[12%]",
        sizeClass: "w-14 h-14 md:w-32 md:h-32",
        rating: 5,
    },
    {
        id: 3,
        name: "Zara Sheikh",
        role: "Product Manager @ Innovate",
        content: "The course quality is excellent and the platform is genuinely intuitive. I completed two courses in a month &mdash; best online learning experience I&apos;ve had.",
        avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=256&auto=format&fit=crop",
        positionClass: "md:absolute md:top-[18%] md:right-[8%]",
        sizeClass: "w-16 h-16 md:w-28 md:h-28",
        rating: 5,
    },
    {
        id: 4,
        name: "David Kim",
        role: "Frontend Developer",
        content: "The community here is unmatched. I&apos;ve collaborated with peers from around the world on capstone projects that actually landed me my current job.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop",
        positionClass: "md:absolute md:bottom-[15%] md:right-[15%]",
        sizeClass: "w-14 h-14 md:w-24 md:h-24",
        rating: 5,
    },
    {
        id: 5,
        name: "Emily Davis",
        role: "UX Researcher",
        content: "The variety of courses is staggering, but the curation makes it so easy to find exactly what I need to upskill for my next project.",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop",
        positionClass: "md:absolute md:top-[5%] md:left-[40%]",
        sizeClass: "w-14 h-14 md:w-20 md:h-20",
        rating: 5,
    },
    {
        id: 6,
        name: "Tariq Ali",
        role: "Marketing Director",
        content: "I&apos;ve tried dozens of platforms, but the gamified learning and stunning UI keep me coming back every single day. Highly recommended.",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop",
        positionClass: "md:absolute md:bottom-[5%] md:right-[42%]",
        sizeClass: "w-14 h-14 md:w-20 md:h-20",
        rating: 5,
    }
];

export function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const activeTestimonial = testimonials[activeIndex];

    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(() => {
            handleAvatarClick((activeIndex + 1) % testimonials.length, true);
        }, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, isAutoPlaying]);

    const handleAvatarClick = (index: number, fromAutoPlay = false) => {
        if (index === activeIndex) return;
        if (!fromAutoPlay) setIsAutoPlaying(false);

        if (!contentRef.current) {
            setActiveIndex(index);
            return;
        }

        gsap.to(contentRef.current, {
            opacity: 0,
            scale: 0.95,
            y: 10,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                setActiveIndex(index);
                gsap.to(contentRef.current, {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.4,
                    ease: "back.out(1.5)"
                });
            }
        });
    };

    useGSAP(() => {
        // Floating animations for avatars
        if (typeof document !== "undefined") {
            const avatarContainers = gsap.utils.toArray(".gsap-avatar-container") as HTMLElement[];
            avatarContainers.forEach((elem) => {
                gsap.to(elem, {
                    y: "random(-15, 15)",
                    x: "random(-10, 10)",
                    rotation: "random(-5, 5)",
                    duration: "random(3, 5)",
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: "random(0, 2)"
                });
            });
        }

        // Intro animation
        gsap.fromTo(".gsap-test-intro",
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
            }
        );
    }, { scope: sectionRef });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        // Tilt center box
        gsap.to(".gsap-center-box", {
            rotationY: x * 10,
            rotationX: -y * 10,
            transformPerspective: 1000,
            ease: "power2.out",
            duration: 0.6
        });

        // Parallax depth for avatars
        if (typeof document !== "undefined") {
            const avatarWrappers = gsap.utils.toArray(".gsap-avatar-wrapper") as HTMLElement[];
            avatarWrappers.forEach((elem, i) => {
                const depth = (i % 3) + 1;
                gsap.to(elem, {
                    x: x * 40 * depth,
                    y: y * 40 * depth,
                    ease: "power2.out",
                    duration: 1
                });
            });
        }
    };

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                gsap.to(".gsap-center-box", { rotationY: 0, rotationX: 0, ease: "power3.out", duration: 0.8 });
                gsap.to(".gsap-avatar-wrapper", { x: 0, y: 0, ease: "power3.out", duration: 0.8 });
            }}
            className="relative py-20 md:py-32 bg-background overflow-hidden perspective-1000"
        >
            {/* Ambient Base Glow */}
            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">

                <div className="gsap-test-intro relative z-20 text-center max-w-2xl mx-auto mb-10 md:mb-0">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                        Testimonials
                    </p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
                        Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">millions</span>
                    </h2>
                </div>

                {/* Main Interactive Interactive Stage */}
                <div className="relative w-full md:h-[650px] lg:h-[750px] flex flex-col md:block items-center justify-center mt-12 md:mt-16">

                    {/* Center Content Box */}
                    <div className="gsap-center-box z-30 w-full max-w-2xl mx-auto md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 will-change-transform">
                        <div
                            className="relative bg-card/60 backdrop-blur-xl border border-border/50 shadow-2xl rounded-[2.5rem] p-8 md:p-14 overflow-hidden"
                            onMouseEnter={() => setIsAutoPlaying(false)}
                            onMouseLeave={() => setIsAutoPlaying(true)}
                        >
                            <Quote className="absolute -top-6 -left-6 w-40 h-40 text-primary/5 -rotate-12 pointer-events-none" />
                            <Quote className="absolute -bottom-6 -right-6 w-40 h-40 text-primary/5 rotate-12 pointer-events-none" />

                            <div ref={contentRef} className="relative z-10 flex flex-col items-center text-center">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(activeTestimonial.rating)].map((_, i) => (
                                        <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                                    ))}
                                </div>
                                <p className="text-xl md:text-3xl font-medium leading-relaxed tracking-tight text-foreground mb-8 text-balance">
                                    &ldquo;{activeTestimonial.content}&rdquo;
                                </p>

                                <div className="flex flex-col items-center bg-primary/5 py-3 px-6 rounded-full border border-primary/10">
                                    <h4 className="text-lg font-bold text-foreground">
                                        {activeTestimonial.name}
                                    </h4>
                                    <p className="text-sm font-medium text-primary">
                                        {activeTestimonial.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Avatars Row */}
                    <div className="flex md:hidden w-[100vw] -ml-4 px-4 gap-4 overflow-x-auto snap-x py-8 z-40 relative" style={{ scrollbarWidth: 'none' }}>
                        {testimonials.map((t, i) => (
                            <div
                                key={`mob-${t.id}`}
                                onClick={() => handleAvatarClick(i)}
                                className={`snap-center shrink-0 w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-300 cursor-pointer ${activeIndex === i ? 'border-primary shadow-lg shadow-primary/20 scale-110' : 'border-background opacity-50 saturate-50'}`}
                            >
                                <Image src={t.avatar} alt={t.name} width={100} height={100} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>

                    {/* Desktop Orbiting Avatars */}
                    <div className="hidden md:block absolute inset-0 pointer-events-none z-20">
                        {testimonials.map((t, i) => (
                            <div key={`desk-${t.id}`} className={`gsap-avatar-wrapper pointer-events-auto ${t.positionClass}`}>
                                <div
                                    className={`gsap-avatar-container relative rounded-full overflow-hidden cursor-pointer transition-all duration-500 ease-out will-change-transform
                                        ${t.sizeClass} 
                                        ${activeIndex === i ? 'ring-4 ring-primary ring-offset-4 ring-offset-background scale-110 shadow-2xl shadow-primary/30 z-50' : 'opacity-60 hover:opacity-100 hover:scale-110 saturate-50 hover:saturate-100 shadow-xl'}
                                    `}
                                    onMouseEnter={() => handleAvatarClick(i)}
                                >
                                    <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
