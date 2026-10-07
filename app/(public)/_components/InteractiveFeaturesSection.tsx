"use client";

import { useRef } from "react";
import { BadgeCheck, PlaySquare, Sparkles, BrainCircuit } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const features = [
    {
        icon: PlaySquare,
        title: "Immersive Video Learning",
        description: "Experience buffer-free, high-definition streaming adapted to your connection speed. Our custom player ensures you never miss a detail.",
        color: "from-blue-500/20 to-cyan-500/20",
        iconColor: "text-blue-500"
    },
    {
        icon: BrainCircuit,
        title: "AI-Powered Assistance",
        description: "Get unstuck instantly. Our context-aware AI tutor understands exactly what video lesson you are watching to provide perfectly tailored guidance.",
        color: "from-purple-500/20 to-pink-500/20",
        iconColor: "text-purple-500"
    },
    {
        icon: Sparkles,
        title: "Interactive Mastery",
        description: "Test your knowledge with dynamic quizzes that adapt to your skill level, reinforcing your understanding of crucial concepts before moving forward.",
        color: "from-amber-500/20 to-orange-500/20",
        iconColor: "text-amber-500"
    },
    {
        icon: BadgeCheck,
        title: "Verifiable Certifications",
        description: "Earn beautifully designed, blockchain-anchored certificates upon course completion that you can instantly share on LinkedIn.",
        color: "from-emerald-500/20 to-teal-500/20",
        iconColor: "text-emerald-500"
    }
];

export function InteractiveFeaturesSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const panelsRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const panels = gsap.utils.toArray<HTMLElement>('.feature-panel');
        if (!panels.length || !scrollContainerRef.current) return;

        // Calculate the total width to scroll
        const scrollWidth = scrollContainerRef.current.scrollWidth - window.innerWidth;

        // Create the horizontal scroll animation
        gsap.to(panelsRef.current, {
            x: () => -scrollWidth,
            ease: "none",
            scrollTrigger: {
                trigger: sectionRef.current,
                pin: true,
                scrub: 1, // Smooth scrubbing
                start: "top top",
                end: () => `+=${scrollWidth}`,
                invalidateOnRefresh: true,
            }
        });

        // Add stagger fade-in for panel content as they enter the viewport
        panels.forEach((panel, i) => {
            const content = panel.querySelector('.panel-content');

            // Only animate content of panels that are off-screen initially
            if (i > 0) {
                gsap.from(content, {
                    opacity: 0,
                    y: 50,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: panel,
                        containerAnimation: gsap.getById("horizontalScroll"), // Link to the horizontal scroll
                        start: "left center+=200",
                        toggleActions: "play none none reverse",
                    }
                });
            }
        });

    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="relative h-screen bg-background overflow-hidden select-none">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(93,134,108,0.03)_0%,transparent_100%)] pointer-events-none" />

            <div className="absolute top-1/2 left-6 md:left-12 lg:left-24 xl:left-32 2xl:left-40 -translate-y-1/2 z-10 max-w-sm pointer-events-none">
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-foreground">
                    Built for <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Excellence.</span>
                </h2>
                <p className="mt-6 text-lg text-muted-foreground">
                    Scroll to explore the cutting-edge features powering your learning journey.
                </p>
            </div>

            {/* Scrolling Container */}
            <div
                ref={scrollContainerRef}
                className="absolute top-0 left-0 h-full w-full flex items-center z-20 pointer-events-none"
            >
                <div
                    ref={panelsRef}
                    className="flex h-full items-center pl-[100vw] pr-[20vw] pointer-events-auto" // Start panels offscreen right
                    id="horizontalScroll"
                >
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-panel w-[85vw] md:w-[60vw] lg:w-[45vw] h-[60vh] max-h-[600px] flex-shrink-0 mx-4 md:mx-8 relative group"
                        >
                            {/* Card Background with Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl`} />

                            {/* Card Content container */}
                            <div className="panel-content relative h-full w-full bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 md:p-12 flex flex-col justify-center overflow-hidden hover:border-primary/20 shadow-xl shadow-black/[0.03] transition-colors duration-500">
                                {/* Decorative circle */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-8 border border-primary/10 ${feature.iconColor}`}>
                                    <feature.icon className="w-8 h-8 md:w-10 md:h-10" />
                                </div>

                                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                                    {feature.title}
                                </h3>

                                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
