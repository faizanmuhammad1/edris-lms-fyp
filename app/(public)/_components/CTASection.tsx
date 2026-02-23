"use client";

import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef, useEffect } from "react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function CTASection() {
    const sectionRef = useRef<HTMLElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
            }
        });

        tl.fromTo(".gsap-cta-card",
            { y: 100, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" }
        )
            .fromTo(".gsap-cta-badge",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
                "-=0.6"
            )
            .fromTo(".gsap-cta-title",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                "-=0.5"
            )
            .fromTo(".gsap-cta-desc",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
                "-=0.6"
            )
            .fromTo(".gsap-cta-btns",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.2)" },
                "-=0.5"
            )
            .fromTo(".gsap-cta-social",
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.8 },
                "-=0.4"
            );

        // Continuous slow rotation for background blobs
        gsap.to(".gsap-blob-1", {
            rotation: 360,
            x: 50,
            y: 30,
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        gsap.to(".gsap-blob-2", {
            rotation: -360,
            x: -50,
            y: -40,
            duration: 25,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: sectionRef });

    // Magnetic Button Effect
    useEffect(() => {
        const magnets = document.querySelectorAll('.gsap-magnetic-cta');

        magnets.forEach((magnet) => {
            const el = magnet as HTMLElement;

            const handleMouseMove = (e: MouseEvent) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                gsap.to(el, {
                    x: x * 0.2,
                    y: y * 0.2,
                    duration: 0.4,
                    ease: "power2.out"
                });
            };

            const handleMouseLeave = () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
            };

            el.addEventListener('mousemove', handleMouseMove);
            el.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                el.removeEventListener('mousemove', handleMouseMove);
                el.removeEventListener('mouseleave', handleMouseLeave);
            };
        });
    }, []);

    // 3D Card Hover Effect
    const handleMouseMoveCard = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            transformPerspective: 1000,
            ease: "power2.out",
            duration: 0.4
        });

        // Move the internal shine/glow to cursor
        const innerGlow = card.querySelector('.inner-glow') as HTMLElement;
        if (innerGlow) {
            gsap.to(innerGlow, {
                x: x - rect.width / 2,
                y: y - rect.height / 2,
                duration: 0.8,
                ease: "power2.out"
            });
        }
    };

    const handleMouseLeaveCard = () => {
        if (!cardRef.current) return;
        gsap.to(cardRef.current, { rotationX: 0, rotationY: 0, duration: 0.8, ease: "power3.out" });

        const innerGlow = cardRef.current.querySelector('.inner-glow') as HTMLElement;
        if (innerGlow) {
            gsap.to(innerGlow, { x: 0, y: 0, duration: 0.8, ease: "power3.out" });
        }
    };

    return (
        <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden bg-background">
            {/* Global Ambient Noise Texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="container relative z-20 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">

                <div
                    ref={cardRef}
                    onMouseMove={handleMouseMoveCard}
                    onMouseLeave={handleMouseLeaveCard}
                    className="gsap-cta-card relative mx-auto max-w-5xl rounded-[2.5rem] bg-zinc-950/95 overflow-hidden border border-zinc-800 shadow-[0_0_100px_rgba(var(--primary),0.1)] group will-change-transform"
                >
                    {/* Animated Background Gradients internal to card */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

                    {/* Floating Orbs inside card */}
                    <div className="gsap-blob-1 absolute -top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] pointer-events-none mix-blend-screen opacity-50" />
                    <div className="gsap-blob-2 absolute -bottom-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-[100px] pointer-events-none mix-blend-screen opacity-50" />

                    {/* Grid Pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                    {/* Interactive Inner Glow tied to cursor */}
                    <div className="inner-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative z-10 px-6 py-16 md:py-24 md:px-12 lg:px-20 flex flex-col items-center text-center">

                        {/* Badge */}
                        <div className="gsap-cta-badge mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-5 py-2 text-sm font-semibold text-zinc-100 shadow-inner">
                            <Rocket className="h-4 w-4 text-primary" />
                            Your Future Starts Here
                        </div>

                        <h2 className="gsap-cta-title text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                            Ready to start{" "}
                            <span className="relative whitespace-nowrap">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">learning?</span>
                                <span className="absolute -bottom-2 left-0 w-full h-3 bg-primary/20 -rotate-2 rounded-full blur-sm" />
                            </span>
                        </h2>

                        <p className="gsap-cta-desc text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium mb-12">
                            Join thousands of students building real skills with expert-led
                            courses, AI-powered support, and blockchain-verified certificates.
                            The next level of your career is waiting.
                        </p>

                        <div className="gsap-cta-btns flex flex-col sm:flex-row items-center justify-center gap-5 w-full md:w-auto">
                            <Link href="/courses" className="w-full sm:w-auto">
                                <div className="gsap-magnetic-cta inline-flex items-center justify-center h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold tracking-wide hover:shadow-[0_0_40px_rgba(var(--primary),0.4)] transition-all duration-300 w-full sm:w-auto group/btn">
                                    Browse Courses
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                </div>
                            </Link>
                            <Link href="/signup" className="w-full sm:w-auto">
                                <div className="gsap-magnetic-cta inline-flex items-center justify-center h-14 px-8 rounded-full bg-white/10 text-white font-bold tracking-wide border border-white/10 hover:bg-white/20 hover:border-white/30 backdrop-blur-md transition-all duration-300 w-full sm:w-auto">
                                    Create Free Account
                                </div>
                            </Link>
                        </div>

                        {/* Social proof line */}
                        <div className="gsap-cta-social mt-14 pt-8 border-t border-white/10 w-full max-w-md mx-auto flex flex-col items-center justify-center gap-4">
                            <div className="flex -space-x-3">
                                {["Leo", "Mia", "Sam", "Zoe"].map((seed) => (
                                    <div
                                        key={seed}
                                        className="inline-block h-10 w-10 rounded-full border-2 border-zinc-950 bg-zinc-800 overflow-hidden relative z-10 hover:z-20 hover:scale-110 transition-transform shadow-lg"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`}
                                            alt="Student Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm font-medium text-zinc-400">
                                Joined by <strong className="text-white">2,000+</strong> learners this month
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
