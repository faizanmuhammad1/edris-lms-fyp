"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BookOpen, CheckCircle, LayoutDashboard, Settings, Video, Search, Bell, Shield } from "lucide-react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function PlatformMockupSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const mockupContainerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!mockupContainerRef.current) return;

        // Animate the mockup container scaling up and rotating slightly into place as the user scrolls
        gsap.fromTo(
            mockupContainerRef.current,
            { scale: 0.85, rotationX: 15, opacity: 0.8, y: 100 },
            {
                scale: 1,
                rotationX: 0,
                opacity: 1,
                y: 0,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "center center",
                    scrub: 1,
                },
            }
        );

        // Internal staggered enter animation for dashboard elements
        gsap.fromTo(".gsap-mockup-item",
            { y: 20, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                stagger: 0.05,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top center",
                },
            }
        );
    }, { scope: sectionRef });

    return (
        <section
            ref={sectionRef}
            className="relative w-full py-24 md:py-32 overflow-hidden bg-background"
            style={{ perspective: "1000px" }} // Required for the 3D rotationX effect
        >
            <div className="container relative mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40 z-10 flex flex-col items-center">

                <div className="text-center mb-16 max-w-2xl">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                        Platform Experience
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                        A workspace designed <br className="hidden md:block" /> for focus.
                    </h2>
                </div>

                {/* The Mockup Container */}
                <div
                    ref={mockupContainerRef}
                    className="relative w-full max-w-5xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden ring-1 ring-black/[0.04]"
                    style={{ transformOrigin: "center bottom" }}
                >
                    {/* Browser-style Title Bar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 backdrop-blur-sm">
                        <span className="h-3 w-3 rounded-full bg-red-400/90 shadow-sm" />
                        <span className="h-3 w-3 rounded-full bg-yellow-400/90 shadow-sm" />
                        <span className="h-3 w-3 rounded-full bg-green-400/90 shadow-sm" />
                        <div className="ml-4 flex-1 flex items-center gap-2 rounded-md bg-background px-3 py-1.5 shadow-sm border border-border/50 max-w-md mx-auto relative">
                            <span className="text-[12px] text-muted-foreground font-medium flex-1 text-center truncate">
                                edris-lms.com/dashboard
                            </span>
                        </div>
                    </div>

                    {/* Realistic HTML Dashboard Mockup */}
                    <div className="relative w-full aspect-[16/10] bg-[#fdfdfd] dark:bg-[#0p0p0p] flex overflow-hidden">

                        {/* Sidebar */}
                        <div className="hidden sm:flex w-64 bg-white dark:bg-card border-r border-border/60 flex-col p-4">
                            <div className="gsap-mockup-item flex items-center gap-2 px-2 py-4 mb-6">
                                <Shield className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg text-foreground">Edris LMS</span>
                            </div>

                            <nav className="flex-1 space-y-1 block">
                                {[
                                    { icon: LayoutDashboard, label: 'Dashboard', active: true },
                                    { icon: BookOpen, label: 'My Courses' },
                                    { icon: Video, label: 'Live Sessions' },
                                    { icon: CheckCircle, label: 'Certificates' },
                                ].map((item, i) => (
                                    <div key={i} className={`gsap-mockup-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </div>
                                ))}
                            </nav>

                            <div className="gsap-mockup-item mt-auto border-t border-border/50 pt-4">
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted cursor-pointer">
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col bg-muted/20 dark:bg-muted/10 h-full overflow-hidden">
                            {/* Top Navbar */}
                            <header className="gsap-mockup-item h-16 bg-white/50 dark:bg-card/50 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 shrink-0">
                                <div className="relative w-64 hidden md:block">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <div className="h-9 w-full bg-muted/50 border border-border/50 rounded-md flex items-center pl-9 text-xs text-muted-foreground">
                                        Search courses...
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-auto">
                                    <div className="relative p-2 text-muted-foreground hover:bg-muted rounded-full cursor-pointer">
                                        <Bell className="h-4 w-4" />
                                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white" />
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent border-2 border-background shadow-sm" />
                                </div>
                            </header>

                            {/* Dashboard Content */}
                            <div className="p-6 md:p-8 flex-1 overflow-hidden flex flex-col gap-8">

                                {/* Welcome Hero Block */}
                                <div className="gsap-mockup-item w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8 shrink-0">
                                    <div className="relative z-10 max-w-lg">
                                        <h3 className="text-2xl font-bold text-foreground mb-2">Welcome back, Alex! 👋</h3>
                                        <p className="text-sm text-muted-foreground font-medium mb-6">You&apos;ve learned for 4 hours this week. Keep up the great work!</p>
                                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 cursor-pointer">
                                            Resume Learning
                                        </div>
                                    </div>
                                    {/* Decorative shape */}
                                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                                </div>

                                {/* In Progress Courses */}
                                <div className="flex flex-col gap-4">
                                    <h4 className="gsap-mockup-item text-lg font-bold text-foreground">In Progress</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { title: "Advanced React Hooks", progress: 75, color: "bg-blue-500" },
                                            { title: "UI/UX Design Masterclass", progress: 30, color: "bg-pink-500" },
                                            { title: "Web3 Smart Contracts", progress: 12, color: "bg-emerald-500" }
                                        ].map((course, idx) => (
                                            <div key={idx} className="gsap-mockup-item bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                                <div className={`w-full h-24 ${course.color}/10 rounded-lg mb-4 flex items-center justify-center border border-border/30`}>
                                                    <div className="w-10 h-10 rounded-full bg-background/80 shadow-sm flex items-center justify-center border border-border">
                                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-primary border-b-[5px] border-b-transparent ml-0.5" />
                                                    </div>
                                                </div>
                                                <h5 className="font-bold text-sm text-foreground truncate mb-1">{course.title}</h5>
                                                <div className="flex justify-between items-center mt-3">
                                                    <span className="text-xs text-muted-foreground font-medium">{course.progress}% Complete</span>
                                                    <span className="text-xs font-bold text-foreground">Continue</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                                                    <div className={`h-full ${course.color}`} style={{ width: `${course.progress}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                {/* Soft ambient glow beneath the mockup */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-4xl h-[400px] bg-primary/[0.05] blur-[100px] rounded-full pointer-events-none -z-10" />
            </div>
        </section>
    );
}
