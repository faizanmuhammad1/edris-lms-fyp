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
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(
                `/courses?search=${encodeURIComponent(searchQuery.trim())}`
            );
        }
    };

    return (
        <section className="relative w-full overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
            {/* ── Background layers ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.35]" />

            {/* Soft ambient glow */}
            <div className="pointer-events-none absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/[0.06] blur-[100px]" />

            <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                    {/* ── Left: Content ── */}
                    <motion.div
                        className="flex flex-col"
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        {/* Badge */}
                        <motion.div
                            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, duration: 0.5 }}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            AI-Powered Learning Platform
                        </motion.div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl xl:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-foreground">
                            Learn smarter with{" "}
                            <span className="text-primary">
                                AI&#8209;powered
                            </span>{" "}
                            courses
                        </h1>

                        {/* Subtitle */}
                        <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
                            Expert-led video courses paired with an AI assistant that answers
                            your questions in real-time — plus every certificate is verifiable
                            on the blockchain.
                        </p>

                        {/* CTAs */}
                        <motion.div
                            className="mt-8 flex flex-wrap items-center gap-4"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.5 }}
                        >
                            <Link href="/courses">
                                <Button
                                    size="lg"
                                    className="group h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25"
                                >
                                    Browse Courses
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                            <Link href="#how-it-works">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 px-8 text-base font-semibold"
                                >
                                    How It Works
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Search Bar */}
                        <motion.form
                            onSubmit={handleSearch}
                            className="mt-8 max-w-lg"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45, duration: 0.5 }}
                        >
                            <div className="relative flex items-center rounded-xl border border-border bg-card shadow-sm transition-all duration-300 focus-within:shadow-lg focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/[0.08]">
                                <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 h-12 text-base px-4"
                                    placeholder="Search for courses..."
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="mr-1.5 rounded-lg h-9 px-5 shrink-0"
                                >
                                    Search
                                </Button>
                            </div>

                            {/* Popular tags */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Popular:
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
                                        className="text-xs px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </motion.form>

                        {/* Trust Metrics */}
                        <motion.div
                            className="mt-10 flex flex-wrap items-center gap-6 md:gap-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                        >
                            {stats.map((stat, i) => (
                                <div
                                    key={stat.label}
                                    className="flex items-center gap-2.5"
                                >
                                    {i > 0 && (
                                        <div className="hidden sm:block w-px h-8 bg-border mr-2 -ml-2 md:mr-3 md:-ml-3" />
                                    )}
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        <stat.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-foreground leading-none">
                                            {stat.value}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* ── Right: Platform Screenshot Mockup ── */}
                    <motion.div
                        className="relative hidden lg:block"
                        initial={{ opacity: 0, x: 40, rotateY: 4 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        {/* Layered depth glow */}
                        <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.06] blur-2xl" />
                        <div className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-primary/[0.04] to-accent/[0.04] blur-xl" />

                        {/* Browser-style frame */}
                        <div className="relative rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/[0.04]">
                            {/* Title bar */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
                                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                                <span className="h-3 w-3 rounded-full bg-green-400/70" />
                                <div className="ml-3 flex-1 flex items-center gap-2 rounded-md bg-background/60 px-3 py-1">
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                                    <span className="text-[11px] text-muted-foreground font-medium truncate">
                                        edris-lms.com/dashboard
                                    </span>
                                </div>
                            </div>

                            {/* Screenshot */}
                            <div className="relative aspect-[4/3]">
                                <Image
                                    src="/hero-dashboard.png"
                                    alt="Edris LMS platform — course dashboard"
                                    fill
                                    className="object-cover object-top"
                                    priority
                                    sizes="(max-width: 1024px) 0vw, 50vw"
                                />
                            </div>
                        </div>

                        {/* Floating accent cards */}
                        <motion.div
                            className="absolute -bottom-4 -left-6 rounded-xl border border-border bg-card/90 backdrop-blur-md p-3 shadow-lg"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                    <Award className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground leading-none">
                                        Certified
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Blockchain Verified
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute -top-3 -right-4 rounded-xl border border-border bg-card/90 backdrop-blur-md p-3 shadow-lg"
                            animate={{ y: [0, 6, 0] }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1,
                            }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex -space-x-1.5">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-7 w-7 rounded-full border-2 border-card bg-muted overflow-hidden"
                                        >
                                            <Image
                                                src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=student-${i}`}
                                                alt=""
                                                width={28}
                                                height={28}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <svg
                                                key={s}
                                                className="h-3 w-3 fill-amber-500 text-amber-500"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        2K+ happy learners
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
