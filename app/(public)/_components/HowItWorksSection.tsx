"use client";

import { Search, PlayCircle, BadgeCheck, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const steps = [
    {
        number: "01",
        icon: Search,
        title: "Browse & Enroll",
        description:
            "Explore our catalog, filter by category or skill level, and enroll in courses that match your goals.",
    },
    {
        number: "02",
        icon: PlayCircle,
        title: "Learn at Your Pace",
        description:
            "Watch video lessons, take quizzes, and ask our AI assistant whenever you get stuck — all on your schedule.",
    },
    {
        number: "03",
        icon: BadgeCheck,
        title: "Get Certified",
        description:
            "Complete your course and receive a blockchain-verified certificate that employers can trust instantly.",
    },
];

export function HowItWorksSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        gsap.from(".gsap-how-header", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".gsap-how-header",
                start: "top 85%",
            }
        });

        gsap.from(".gsap-how-step", {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "back.out(1.1)",
            scrollTrigger: {
                trigger: ".gsap-how-grid",
                start: "top 80%",
            }
        });

        gsap.from(".gsap-how-line", {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.5,
            ease: "power2.inOut",
            scrollTrigger: {
                trigger: ".gsap-how-grid",
                start: "top 80%",
            }
        });

        gsap.from(".gsap-how-btn", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".gsap-how-btn",
                start: "top 95%",
            }
        });

    }, { scope: sectionRef });

    return (
        <section id="how-it-works" ref={sectionRef} className="relative py-20 md:py-28 bg-muted/30 overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.15]" />

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">
                {/* Section Header */}
                <div className="gsap-how-header mx-auto max-w-2xl text-center mb-16">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                        How It Works
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Three steps to a new skill
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        From browsing to certified — here is how your learning journey unfolds.
                    </p>
                </div>

                {/* Steps */}
                <div className="gsap-how-grid relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {/* Gradient Connecting Line (desktop only) */}
                    <div className="hidden md:block absolute top-[4.5rem] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-0.5">
                        <div className="gsap-how-line h-full w-full bg-primary/30 rounded-full" />
                    </div>

                    {steps.map((step) => (
                        <div key={step.number} className="gsap-how-step group relative">
                            <div className="relative flex flex-col h-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 md:p-10 transition-all duration-500 hover:bg-card/80 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/[0.08] hover:-translate-y-2 overflow-hidden items-start text-left">
                                {/* Hover Gradient Orb */}
                                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0" />

                                {/* Giant Faded Number */}
                                <div className="absolute -bottom-8 -right-4 text-[120px] leading-none font-black text-foreground/[0.03] group-hover:text-primary/[0.05] transition-colors duration-500 select-none z-0 pointer-events-none">
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className="relative z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110">
                                    <step.icon className="h-7 w-7" />
                                </div>

                                {/* Content */}
                                <h3 className="relative z-10 text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                                    {step.title}
                                </h3>
                                <p className="relative z-10 text-muted-foreground leading-relaxed text-[17px]">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA below steps */}
                <div className="gsap-how-btn mt-12 text-center">
                    <Link href="/courses">
                        <Button
                            size="lg"
                            className="group h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20"
                        >
                            Start Learning Now
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
