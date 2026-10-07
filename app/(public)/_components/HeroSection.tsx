import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, Search, Sparkles, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import type { LandingStats } from "@/app/data/landing/get-landing-stats";
import { containerClass } from "./SectionHeading";

function formatStat(value: number): string {
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k+`;
    return value.toLocaleString();
}

const popularSearches = [
    { label: "Python", category: "Development" },
    { label: "React", category: "Development" },
    { label: "Data Science", category: "Data Science" },
    { label: "Design", category: "Design" },
];

interface HeroSectionProps {
    stats: LandingStats;
}

export function HeroSection({ stats: platformStats }: HeroSectionProps) {
    const stats = [
        { icon: Users, value: formatStat(platformStats.totalStudents), label: "Active students" },
        { icon: BookOpen, value: formatStat(platformStats.totalCourses), label: "Published courses" },
        { icon: Award, value: formatStat(platformStats.totalCertificates), label: "Certificates issued" },
    ];
    const hasRating = platformStats.averageRating > 0;

    return (
        <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden border-b">
            {/* Single, quiet brand wash */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary/[0.07] to-transparent"
            />

            <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
                    {/* Copy */}
                    <div className="flex min-w-0 flex-col items-start">
                        <Badge variant="outline" className="mb-6 gap-1.5 border-primary/25 bg-primary/5 px-3 py-1 text-primary">
                            <Sparkles aria-hidden="true" />
                            Edris Learning 2.0 is here
                        </Badge>

                        <h1
                            id="hero-heading"
                            className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl"
                        >
                            Master new skills with an <span className="text-primary">AI tutor</span> by your side
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            Learn from expert-led video courses, get instant answers from our AI assistant, and earn
                            blockchain-verified certificates you can share with employers.
                        </p>

                        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            <Link href="/courses" className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}>
                                Explore courses
                                <ArrowRight aria-hidden="true" />
                            </Link>
                            <Link
                                href="#how-it-works"
                                className={buttonVariants({ size: "lg", variant: "outline", className: "h-12 px-6 text-base" })}
                            >
                                See how it works
                            </Link>
                        </div>

                        {/* Search (plain GET form — works without JavaScript) */}
                        <form role="search" action="/courses" method="get" className="mt-10 w-full max-w-lg">
                            <label htmlFor="hero-search" className="text-sm font-medium text-foreground">
                                What do you want to learn?
                            </label>
                            <div className="mt-2 flex gap-2 rounded-xl border bg-card p-1.5 shadow-sm focus-within:ring-[3px] focus-within:ring-ring/40">
                                <div className="relative min-w-0 flex-1">
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        id="hero-search"
                                        name="search"
                                        type="search"
                                        maxLength={100}
                                        autoComplete="off"
                                        placeholder="e.g. React, marketing, finance"
                                        className="h-10 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0 dark:bg-transparent"
                                    />
                                </div>
                                <Button type="submit" className="h-10 shrink-0 px-4">
                                    Search
                                </Button>
                            </div>
                        </form>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Popular:</span>
                            {popularSearches.map((tag) => (
                                <Link
                                    key={tag.label}
                                    href={`/courses?category=${encodeURIComponent(tag.category)}`}
                                    className="inline-flex min-h-8 items-center rounded-full border bg-background px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                    {tag.label}
                                </Link>
                            ))}
                        </div>

                        {/* Real platform stats */}
                        <dl className="mt-10 grid w-full max-w-lg grid-cols-3 gap-4 border-t pt-6">
                            {stats.map((stat) => (
                                <div key={stat.label} className="min-w-0">
                                    <dt className="text-xs font-medium text-muted-foreground sm:text-sm">{stat.label}</dt>
                                    <dd className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* Product preview (decorative) */}
                    <div aria-hidden="true" className="relative hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 lg:block">
                        <div className="relative mx-auto max-w-md rounded-2xl border bg-card p-5 shadow-xl shadow-primary/5">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <div className="flex size-10 items-center justify-center rounded-xl border bg-primary/10">
                                    <Image src={Logo} alt="" className="size-6" sizes="24px" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Edris AI Tutor</p>
                                    <p className="text-xs text-muted-foreground">Answering questions about your lesson</p>
                                </div>
                            </div>

                            <div className="space-y-3 py-5">
                                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">
                                    Think of a database index like a book&apos;s index — it tells you exactly which page to
                                    open instead of reading every page.
                                </div>
                                <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                                    That makes sense, thanks!
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/40 p-4">
                                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                    <span>Course progress</span>
                                    <span className="text-primary">85%</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full w-[85%] rounded-full bg-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="absolute -right-2 top-10 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg xl:-right-6">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                                <Award className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Certificate issued</p>
                                <p className="text-xs text-muted-foreground">Verified on-chain</p>
                            </div>
                        </div>

                        {hasRating && (
                            <div className="absolute -bottom-7 -left-2 rounded-xl border bg-card px-4 py-3 shadow-lg xl:-left-6">
                                <p className="text-xs font-medium text-muted-foreground">Average course rating</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <Star className="size-4 fill-amber-500 text-amber-500" />
                                    <span className="text-sm font-semibold text-foreground">
                                        {platformStats.averageRating.toFixed(1)} / 5
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
