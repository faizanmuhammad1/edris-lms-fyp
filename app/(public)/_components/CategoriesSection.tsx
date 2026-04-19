"use client";

import Link from "next/link";
import {
    Code,
    Briefcase,
    BarChart3,
    Monitor,
    Palette,
    Megaphone,
    Heart,
    Music,
    ArrowRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const categories = [
    {
        title: "Development",
        icon: Code,
        href: "/courses?category=Development",
        gradient: "from-blue-500/10 to-blue-600/5",
        iconBg: "bg-blue-500/10 group-hover:bg-blue-500/20",
        iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
        title: "Business",
        icon: Briefcase,
        href: "/courses?category=Business",
        gradient: "from-amber-500/10 to-amber-600/5",
        iconBg: "bg-amber-500/10 group-hover:bg-amber-500/20",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
        title: "Finance",
        icon: BarChart3,
        href: "/courses?category=Finance+%26+Accounting",
        gradient: "from-emerald-500/10 to-emerald-600/5",
        iconBg: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
        iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
        title: "IT & Software",
        icon: Monitor,
        href: "/courses?category=IT+%26+Software",
        gradient: "from-violet-500/10 to-violet-600/5",
        iconBg: "bg-violet-500/10 group-hover:bg-violet-500/20",
        iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
        title: "Design",
        icon: Palette,
        href: "/courses?category=Design",
        gradient: "from-pink-500/10 to-pink-600/5",
        iconBg: "bg-pink-500/10 group-hover:bg-pink-500/20",
        iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
        title: "Marketing",
        icon: Megaphone,
        href: "/courses?category=Marketing",
        gradient: "from-orange-500/10 to-orange-600/5",
        iconBg: "bg-orange-500/10 group-hover:bg-orange-500/20",
        iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
        title: "Health & Fitness",
        icon: Heart,
        href: "/courses?category=Health+%26+Fitness",
        gradient: "from-red-500/10 to-red-600/5",
        iconBg: "bg-red-500/10 group-hover:bg-red-500/20",
        iconColor: "text-red-600 dark:text-red-400",
    },
    {
        title: "Music",
        icon: Music,
        href: "/courses?category=Music",
        gradient: "from-cyan-500/10 to-cyan-600/5",
        iconBg: "bg-cyan-500/10 group-hover:bg-cyan-500/20",
        iconColor: "text-cyan-600 dark:text-cyan-400",
    },
];

function getCategoryCount(title: string, categoryCounts: Record<string, number>): string {
    // Map display titles to DB category values
    const mappings: Record<string, string[]> = {
        "Development": ["Development"],
        "Business": ["Business"],
        "Finance": ["Finance & Accounting", "Finance"],
        "IT & Software": ["IT & Software"],
        "Design": ["Design"],
        "Marketing": ["Marketing"],
        "Health & Fitness": ["Health & Fitness"],
        "Music": ["Music"],
    };

    const keys = mappings[title] || [title];
    let count = 0;
    for (const key of keys) {
        count += categoryCounts[key] || 0;
    }
    return `${count} course${count !== 1 ? 's' : ''}`;
}

export function CategoriesSection({ categoryCounts }: { categoryCounts: Record<string, number> }) {
    const sectionRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
            }
        });

        // Header stagger
        tl.from(".gsap-cat-header-item", {
            y: 40,
            opacity: 0,
            rotationX: -20,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.2)",
            transformOrigin: "bottom center"
        });

        // Grid items 3D stagger
        tl.from(".gsap-cat-card", {
            y: 60,
            scale: 0.85,
            rotationX: -15,
            opacity: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",
        }, "-=0.4");
    }, { scope: sectionRef });

    // Handle spotlight tracking for individual cards
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, currentTarget: HTMLDivElement) => {
        const rect = currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find the glow element within this specific card
        const glow = currentTarget.querySelector('.hover-glow') as HTMLDivElement;
        if (glow) {
            gsap.to(glow, {
                x: x - 200, // half of w-[400px]
                y: y - 200,
                duration: 0.4,
                ease: "power2.out"
            });
        }
    };

    return (
        <section ref={sectionRef} className="relative py-24 md:py-32 bg-background overflow-hidden perspective-1000">
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/[0.03] rounded-full blur-[150px]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay pointer-events-none z-0" />
            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">
                {/* Section Header */}
                <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div className="max-w-2xl" style={{ perspective: '1000px' }}>
                        <p className="gsap-cat-header-item inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-4 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Browse by Topic
                        </p>
                        <h2 className="gsap-cat-header-item text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                            Explore Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative inline-block">Categories</span>
                        </h2>
                        <p className="gsap-cat-header-item mt-4 text-muted-foreground text-lg font-medium leading-relaxed">
                            Find the perfect course in any subject. Learn from industry experts and elevate your career to the next level.
                        </p>
                    </div>
                    <Link
                        href="/courses"
                        className="gsap-cat-header-item group flex items-center justify-center shrink-0 w-12 h-12 rounded-full border border-border/80 bg-card shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                    >
                        <ArrowRight className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                    </Link>
                </div>

                {/* Category Grid (Interactive Spotlight) */}
                <div className="gsap-cat-grid group/catgrid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {categories.map((category) => (
                        <div key={category.title} className="gsap-cat-card" style={{ transformStyle: 'preserve-3d' }}>
                            <Link href={category.href} className="block h-full">
                                <div
                                    onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                                    className={`relative h-full overflow-hidden rounded-2xl border border-white/50 dark:border-white/10 bg-card/60 backdrop-blur-xl p-6 transition-all duration-500 hover:z-20 group-hover/catgrid:opacity-60 group-hover/catgrid:blur-[2px] hover:!opacity-100 hover:!blur-none hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-2 group/card`}
                                >
                                    {/* Mouse Tracking Spotlight Glow */}
                                    <div
                                        className="hover-glow pointer-events-none absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/15 to-accent/15 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-[50px] mix-blend-screen"
                                        style={{ transform: 'translate(0px, 0px)' }}
                                    />

                                    {/* Static base gradient inside card */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-[0.15]`} />

                                    <div className="relative z-10 flex flex-col h-full gap-8">
                                        <div className="flex justify-between items-start">
                                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 dark:border-white/5 ${category.iconBg} shadow-inner transition-colors duration-500`}>
                                                <category.icon className={`h-6 w-6 ${category.iconColor} transition-transform duration-500 group-hover/card:scale-110`} />
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover/card:opacity-100 -translate-x-4 group-hover/card:translate-x-0 transition-all duration-500 border border-border">
                                                <ArrowRight className="h-4 w-4 text-primary" />
                                            </div>
                                        </div>
                                        <div className="min-w-0 mt-auto">
                                            <h3 className="text-xl font-bold text-foreground mb-1 group-hover/card:text-primary transition-colors duration-300">
                                                {category.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-muted-foreground">
                                                    {getCategoryCount(category.title, categoryCounts)}
                                                </span>
                                                <span className="w-0 overflow-hidden group-hover/card:w-auto transition-all duration-500 text-xs text-primary font-bold opacity-0 group-hover/card:opacity-100 whitespace-nowrap">
                                                    — Explore
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
