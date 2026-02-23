"use client";

import { useRef, useEffect } from "react";
import { Bot, ShieldCheck, ArrowRight, Cpu, Link as LinkIcon } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import Image from "next/image";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function WhyEdrisSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const bentoRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Section intro
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
            }
        });

        tl.fromTo(".gsap-why-intro p",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        )
            .fromTo(".gsap-why-intro h2",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                "-=0.4"
            )
            .fromTo(".gsap-why-intro .desc",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
                "-=0.6"
            );

        // Bento Grid Entrance
        gsap.fromTo(".gsap-bento-item",
            { y: 60, opacity: 0, scale: 0.95 },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1,
                stagger: 0.15,
                ease: "back.out(1.2)",
                scrollTrigger: {
                    trigger: bentoRef.current,
                    start: "top 80%",
                }
            }
        );

        // Continuous slow rotation for decorative elements
        gsap.to(".gsap-spin-slow", {
            rotation: 360,
            duration: 25,
            repeat: -1,
            ease: "linear"
        });

        gsap.to(".gsap-spin-reverse", {
            rotation: -360,
            duration: 35,
            repeat: -1,
            ease: "linear"
        });

    }, { scope: sectionRef });

    // Magnetic Button Effect
    useEffect(() => {
        const magnets = document.querySelectorAll('.gsap-magnetic');

        magnets.forEach((magnet) => {
            const el = magnet as HTMLElement;
            const content = el.querySelector('.gsap-magnetic-content') as HTMLElement;

            const handleMouseMove = (e: MouseEvent) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Move button slightly towards cursor
                gsap.to(el, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.4,
                    ease: "power2.out"
                });

                // Move content inside button even more (parallax)
                if (content) {
                    gsap.to(content, {
                        x: x * 0.2,
                        y: y * 0.2,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                }
            };

            const handleMouseLeave = () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
                if (content) {
                    gsap.to(content, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
                }
            };

            el.addEventListener('mousemove', handleMouseMove);
            el.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                el.removeEventListener('mousemove', handleMouseMove);
                el.removeEventListener('mouseleave', handleMouseLeave);
            };
        });
    }, []);

    // 3D Card Tilt Effect
    useEffect(() => {
        const cards = document.querySelectorAll('.gsap-tilt-card');

        cards.forEach((card) => {
            const el = card as HTMLElement;
            const handleMouseMove = (e: MouseEvent) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                gsap.to(el, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    transformPerspective: 1000,
                    duration: 0.5,
                    ease: "power2.out"
                });

                // Move abstract gradient blob to cursor
                const blob = el.querySelector('.blob') as HTMLElement;
                if (blob) {
                    gsap.to(blob, {
                        x: x - rect.width / 2,
                        y: y - rect.height / 2,
                        duration: 0.8,
                        ease: "power2.out"
                    });
                }
            };

            const handleMouseLeave = () => {
                gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.8, ease: "power3.out" });
                const blob = el.querySelector('.blob') as HTMLElement;
                if (blob) {
                    gsap.to(blob, { x: 0, y: 0, duration: 0.8, ease: "power3.out" });
                }
            };

            el.addEventListener('mousemove', handleMouseMove);
            el.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                el.removeEventListener('mousemove', handleMouseMove);
                el.removeEventListener('mouseleave', handleMouseLeave);
            };
        });
    }, []);

    return (
        <section ref={sectionRef} className="relative py-24 md:py-32 bg-background overflow-hidden">
            {/* Global Ambient Noise Texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">

                {/* Intro */}
                <div className="gsap-why-intro max-w-3xl mx-auto text-center mb-16 md:mb-24">
                    <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
                        <Cpu className="w-4 h-4 mr-2" /> Why Edris
                    </p>
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">
                        Everything you need <br />
                        <span className="italic font-light text-muted-foreground">to learn</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> and prove it.</span>
                    </h2>
                    <p className="desc text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-medium">
                        A seamless blend of modern technology, expert instruction, and verifiable credentials. We&apos;ve engineered the ultimate learning ecosystem.
                    </p>
                </div>

                {/* Asymmetric Bento Grid */}
                <div ref={bentoRef} className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px] md:auto-rows-[380px]">

                    {/* Item 1: Wide AI Block */}
                    <div className="gsap-bento-item gsap-tilt-card md:col-span-8 relative rounded-3xl overflow-hidden bg-card border border-border/50 group will-change-transform shadow-2xl shadow-primary/5 cursor-crosshair">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0" />

                        {/* Interactive blob & Tech Grid Pattern instead of awkward shape */}
                        <div className="blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-y-0 right-0 w-1/2 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                        <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-between">
                            <div className="max-w-lg">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-primary mb-6 shadow-inner relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                                    <Bot className="h-7 w-7 relative z-10" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                    AI-Powered Tutor
                                </h3>
                                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                                    Stuck on a complex concept? Ask our context-aware AI directly inside video lessons for instant, hyper-specific explanations.
                                </p>
                            </div>

                            <Link href="/courses" className="inline-flex items-center text-primary font-semibold hover:text-foreground transition-colors group/link mt-auto w-max">
                                Meet your tutor <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Item 2: Tall Blockchain Block */}
                    <div className="gsap-bento-item gsap-tilt-card md:col-span-4 relative rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 group will-change-transform shadow-2xl flex flex-col justify-between p-8 md:p-10 cursor-crosshair">
                        <div className="blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-accent/20 rounded-full blur-[60px] pointer-events-none mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-accent" /> Prove It.
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                                Traditional certificates can be faked. Edris credentials are minted on the blockchain, creating permanent, tamper-proof proof of your skills.
                            </p>
                        </div>

                        {/* Abstract floating shapes for blockchain - refined to prevent overlap */}
                        <div className="relative h-32 w-full my-6 flex items-center justify-center opacity-100 group-hover:scale-105 transition-all duration-500">
                            <div className="absolute w-28 h-28 rounded-xl border-2 border-primary/40 rotate-12 gsap-spin-slow" />
                            <div className="absolute w-24 h-24 rounded-full border-2 border-accent/40 -rotate-12 gsap-spin-reverse" />
                            <div className="absolute w-16 h-16 rounded-lg bg-gradient-to-tr from-accent/30 to-primary/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shadow-black/50">
                                <LinkIcon className="h-7 w-7 text-primary drop-shadow-md" />
                            </div>
                        </div>

                        <Link href="/verification" className="relative z-10 w-full rounded-xl bg-primary hover:bg-primary-hover border border-transparent text-primary-foreground shadow-lg shadow-primary/20 text-center py-3 font-semibold transition-all hover:-translate-y-0.5 mt-auto shrink-0">
                            Verify Certificates
                        </Link>
                    </div>

                    {/* Item 3: Square Video Course Block */}
                    <div className="gsap-bento-item md:col-span-6 relative rounded-3xl overflow-hidden bg-zinc-950 text-white border border-zinc-800 group shadow-2xl flex">
                        <div className="absolute inset-0 z-0">
                            {/* Artistic dark video texture */}
                            <Image src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop" alt="Learning" fill className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 grayscale" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
                        </div>

                        <div className="relative z-10 p-8 md:p-10 flex flex-col justify-end w-full h-full">
                            <div>
                                <h3 className="text-3xl font-bold mb-3 flex items-center gap-3 tracking-tight">
                                    Expert-Led Videos
                                </h3>
                                <p className="text-zinc-400 max-w-md">
                                    Forget boring slide-decks. We shoot our courses with 4K multi-cam setups, providing a highly engaging, visual-first learning experience taught by industry veterans.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Item 4: Final visual accent block */}
                    <div className="gsap-bento-item md:col-span-6 relative rounded-3xl overflow-hidden bg-primary p-8 md:p-10 flex flex-col justify-center items-center text-center group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                        <h3 className="relative z-10 text-2xl md:text-3xl font-black text-white mb-6">
                            Ready to transform your career?
                        </h3>
                        <Link href="/courses" className="relative z-10 rounded-full bg-white text-primary px-8 py-4 font-bold tracking-wide hover:shadow-xl hover:scale-105 transition-all duration-300">
                            Explore Curriculum
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
}
