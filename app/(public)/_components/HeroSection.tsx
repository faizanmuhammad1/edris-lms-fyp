"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Users,
    BookOpen,
    Award,
    ArrowRight,
    Star,
} from "lucide-react";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

const stats = [
    { icon: Users, value: "2,000+", label: "Active Students" },
    { icon: BookOpen, value: "50+", label: "Expert Courses" },
    { icon: Award, value: "500+", label: "Certificates Issued" },
];

const popularSearches = [
    { label: "Python", category: "Development" },
    { label: "React", category: "Development" },
    { label: "Data Science", category: "Data Science" },
    { label: "Design", category: "Design" },
];

export function HeroSection() {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const sectionRef = useRef<HTMLElement>(null);
    const orbRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.2 } });

        // Left side text animations
        tl.from(".gsap-hero-badge", { y: 30, opacity: 0, scale: 0.9 })
            .from(".gsap-hero-text", { y: 40, opacity: 0, stagger: 0.1 }, "-=1")
            .from(".gsap-hero-form", { y: 20, opacity: 0, scale: 0.98 }, "-=0.8")
            .from(".gsap-hero-stats", { opacity: 0, y: 20, stagger: 0.1 }, "-=0.8");

        // 3D Parallax entry
        tl.from(".gsap-3d-cluster", {
            scale: 0.8,
            opacity: 0,
            rotationY: 25,
            rotationX: -15,
            duration: 1.8,
            ease: "back.out(1.2)"
        }, "-=1.5");

        tl.from(".gsap-3d-element", {
            z: -100,
            opacity: 0,
            scale: 0.5,
            stagger: 0.15,
            duration: 1.2,
            ease: "back.out(1.5)"
        }, "-=1.4");

        // Gentle continuous float for the entire cluster
        gsap.to(".gsap-3d-cluster", {
            y: "-=15",
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Continuous float for individual elements to give them microscopic independent life
        gsap.utils.toArray('.gsap-3d-element').forEach((el, i) => {
            gsap.to(el as Element, {
                y: i % 2 === 0 ? "-=10" : "+=10",
                rotationZ: i % 2 === 0 ? "+=2" : "-=2",
                duration: 3 + i,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: i * 0.5
            });
        });

        // Mouse tracking glow orb
        const xTo = gsap.quickTo(orbRef.current, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(orbRef.current, "y", { duration: 0.6, ease: "power3" });

        const moveOrb = (e: MouseEvent) => {
            xTo(e.clientX - 300);
            yTo(e.clientY - 300);
        };

        window.addEventListener("mousemove", moveOrb);

        // Mouse tracking parallax for the 3D cluster
        const section = sectionRef.current;
        const cluster = document.querySelector('.gsap-3d-cluster') as HTMLElement;

        let moveCluster: (e: MouseEvent) => void;
        let resetCluster: () => void;

        if (section && cluster) {
            gsap.set(cluster, { rotationY: -15, rotationX: 10 });

            moveCluster = (e: MouseEvent) => {
                const rect = section.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                gsap.to(cluster, {
                    rotationY: -15 + (x * 30),
                    rotationX: 10 - (y * 30),
                    duration: 1.5,
                    ease: "power3.out"
                });
            };

            resetCluster = () => {
                gsap.to(cluster, {
                    rotationY: -15,
                    rotationX: 10,
                    duration: 1.5,
                    ease: "power3.out"
                });
            };

            section.addEventListener('mousemove', moveCluster);
            section.addEventListener('mouseleave', resetCluster);
        }

        return () => {
            window.removeEventListener("mousemove", moveOrb);
            if (section && cluster && moveCluster && resetCluster) {
                section.removeEventListener('mousemove', moveCluster);
                section.removeEventListener('mouseleave', resetCluster);
            }
        };
    }, { scope: sectionRef });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(
                `/courses?search=${encodeURIComponent(searchQuery.trim())}`
            );
        }
    };

    return (
        <section ref={sectionRef} className="relative w-full overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32 bg-background flex flex-col justify-center min-h-[90vh]">
            {/* Interactive Mouse Tracker Orb */}
            <div
                ref={orbRef}
                className="pointer-events-none fixed top-0 left-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] z-0 hidden lg:block"
                style={{ willChange: 'transform' }}
            />

            {/* Static ambient glow for mobile/base */}
            <div className="pointer-events-none absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-primary/[0.05] blur-[100px] z-0" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none z-0" />

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20 xl:gap-32">
                    {/* ── Left: Content ── */}
                    <div className="flex flex-col z-10 w-full xl:max-w-2xl">
                        {/* Badge */}
                        <div
                            className="gsap-hero-badge mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-md shadow-sm"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                            Edris Learning 2.0 Just Dropped
                        </div>

                        {/* Headline */}
                        <h1 className="gsap-hero-text text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-black tracking-tighter leading-[1.05] text-foreground mb-6">
                            Master the future <br className="hidden md:block" />
                            of learning with{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent relative inline-block">
                                AI Tutors
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="gsap-hero-text text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl font-medium mb-8">
                            Ditch the traditional classroom. Engage with expert-led video courses, get instant answers from our AI assistant, and earn blockchain-verified certificates.
                        </p>

                        {/* CTAs */}
                        <div className="gsap-hero-text flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                            <Link href="/courses" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full group h-14 px-8 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 rounded-xl bg-primary text-primary-foreground"
                                >
                                    Start Learning Free
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="#how-it-works" className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-14 px-8 text-base font-bold border-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 rounded-xl bg-background/50 backdrop-blur-sm"
                                >
                                    See How It Works
                                </Button>
                            </Link>
                        </div>

                        {/* Search Bar - Sleek redesign */}
                        <form
                            onSubmit={handleSearch}
                            className="gsap-hero-form max-w-lg mb-10 relative group"
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                            <div className="relative flex items-center rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm transition-all p-1.5 focus-within:bg-card">
                                <Search className="ml-3 h-5 w-5 text-muted-foreground shrink-0 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 h-10 text-base px-3 font-medium"
                                    placeholder="What do you want to learn today?"
                                />
                                <Button
                                    type="submit"
                                    className="rounded-lg h-10 px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                                >
                                    Explore
                                </Button>
                            </div>

                            {/* Popular tags */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Trending:
                                </span>
                                {popularSearches.map((tag) => (
                                    <button
                                        key={tag.label}
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                `/courses?category=${encodeURIComponent(tag.category)}`
                                            )
                                        }
                                        className="text-sm px-3 py-1 rounded-full bg-muted border border-transparent text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all font-medium"
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </form>

                        {/* Trust Metrics */}
                        <div className="gsap-hero-stats flex flex-wrap items-center gap-4 sm:gap-8 pt-6 border-t border-border/50">
                            {stats.map((stat, i) => (
                                <div
                                    key={stat.label}
                                    className="flex items-center gap-3"
                                >
                                    {i > 0 && (
                                        <div className="hidden sm:block w-px h-8 bg-border mr-2 md:mr-4" />
                                    )}
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-2xl font-black text-foreground tracking-tight">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Dynamic Floating 3D Art ── */}
                    <div className="relative hidden lg:flex h-full w-full items-center justify-end min-h-[550px] xl:min-h-[600px] perspective-[1200px]">

                        <div className="gsap-3d-cluster relative w-full h-full flex items-center justify-center scale-[0.85] lg:scale-[0.80] xl:scale-[0.95] 2xl:scale-[1.05]" style={{ transformStyle: 'preserve-3d' }}>
                            {/* Theme-Adaptive Glowing Backdrops */}
                            <div className="absolute w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-primary/10 via-primary/5 to-accent/10 blur-[70px] pointer-events-none z-0" />

                            {/* Floating Geometrical Rings */}
                            <div className="gsap-3d-element absolute w-[350px] h-[350px] rounded-full border border-primary/20 bg-transparent pointer-events-none" style={{ transform: 'translateZ(-100px) rotateX(60deg) rotateY(-10deg)' }} />
                            <div className="gsap-3d-element absolute w-[250px] h-[250px] rounded-full border border-accent/20 bg-transparent pointer-events-none" style={{ transform: 'translateZ(-50px) rotateX(-60deg) rotateY(10deg)' }} />

                            {/* Center Primary Card : Elegant Mock AI UI */}
                            <div className="gsap-3d-element absolute z-20 w-[360px] rounded-[1.75rem] border border-border/50 bg-card/70 backdrop-blur-3xl p-5 shadow-2xl shadow-primary/5 overflow-hidden" style={{ transform: 'translateZ(50px)' }}>
                                {/* Subtle inner glow line */}
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10">
                                                <Image src={Logo} alt="Edris AI" className="size-6 relative z-10" />
                                                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 border-[2px] border-card animate-pulse z-20" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground leading-tight text-base">Edris AI Tutor</h3>
                                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Assisting with your lesson</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chat Area */}
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-2.5 w-[92%]">
                                            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden">
                                                <Image src={Logo} alt="" className="size-4" />
                                            </div>
                                            <div className="p-3.5 rounded-[1.125rem] rounded-tl-sm bg-muted/50 border border-border/50 backdrop-blur-md">
                                                <p className="text-[13px] font-medium text-foreground leading-relaxed">Let&apos;s break down this concept. Imagine a library—the books are your data.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2.5 w-[85%] ml-auto justify-end">
                                            <div className="p-3.5 rounded-[1.125rem] rounded-tr-sm bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                                <p className="text-[13px] font-medium leading-relaxed">That makes sense! Thanks.</p>
                                            </div>
                                            <div className="h-7 w-7 shrink-0 rounded-full bg-accent/20 flex items-center justify-center border border-accent/10">
                                                <Users className="h-3.5 w-3.5 text-accent-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats / Interactive bar */}
                                    <div className="mt-5 flex flex-col gap-2.5 p-3.5 rounded-[1.125rem] bg-muted/30 border border-border/50">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mastery Level</span>
                                            <span className="text-[10px] font-black text-primary">85%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary to-accent w-[85%] rounded-full relative">
                                                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-4 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Side Card 1 : Achievement/Cert */}
                            <div className="gsap-3d-element absolute z-30 -right-4 lg:-right-2 xl:-right-10 top-32 lg:top-50 w-56 rounded-[1.25rem] border border-border/50 bg-card/70 backdrop-blur-2xl p-4 shadow-xl shadow-foreground/5" style={{ transform: 'translateZ(100px) rotate(4deg)' }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-[30px] pointer-events-none" />
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="flex-shrink-0 h-11 w-11 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-950/40 rounded-[0.75rem] flex items-center justify-center border border-amber-300/50 dark:border-amber-700/50 shadow-inner">
                                        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-foreground leading-tight">Smart Contract</span>
                                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-0.5">Verified Skill</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Side Card 2 : Social/Community */}
                            <div className="gsap-3d-element absolute z-10 -left-6 lg:left-4 xl:-left-10 bottom-16 lg:bottom-30 w-[210px] rounded-[1.25rem] border border-border/50 bg-card/70 backdrop-blur-2xl p-4 shadow-xl shadow-foreground/5" style={{ transform: 'translateZ(80px) rotate(-4deg)' }}>
                                <div className="flex flex-col gap-3 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Live Community
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2.5">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden relative shadow-sm">
                                                    <Image
                                                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=learn-${i + 20}`}
                                                        alt="student"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center relative shadow-sm z-10 backdrop-blur-sm">
                                                <span className="text-[9px] font-black text-primary">+3k</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-muted/40 p-2 rounded-xl border border-border/50 flex flex-col items-start gap-0.5">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] font-bold text-foreground">Average Rating</span>
                                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-500">4.9</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-500 text-amber-500" />)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Floating Dots */}
                            <div className="gsap-3d-element absolute top-10 left-10 w-3 h-3 rounded-full bg-primary/60 blur-[1px]" style={{ transform: 'translateZ(150px)' }} />
                            <div className="gsap-3d-element absolute bottom-0 right-20 w-4 h-4 rounded-full bg-accent/60 blur-[1px]" style={{ transform: 'translateZ(-50px)' }} />
                            <div className="gsap-3d-element absolute top-1/2 -right-10 w-2 h-2 rounded-full bg-primary/40 blur-[1px]" style={{ transform: 'translateZ(90px)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
