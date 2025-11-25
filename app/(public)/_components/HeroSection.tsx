"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative w-full overflow-hidden bg-background py-20 md:py-32 lg:py-40">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-90"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                    <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <div className="space-y-6">
                            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md shadow-sm hover:bg-primary/20 transition-colors cursor-default">
                                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                                New: Blockchain Verified Certificates
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-7xl/none text-foreground drop-shadow-sm">
                                Unlock Your Potential with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">AI-Powered</span> Learning
                            </h1>
                            <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed font-light">
                                Master the skills of tomorrow with our advanced LMS. Personalized AI tutoring, secure assessments, and industry-recognized certifications.
                            </p>
                        </div>

                        <div className="w-full max-w-md space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                                <div className="relative flex items-center bg-background/80 backdrop-blur-xl rounded-full border border-primary/20 shadow-xl p-2">
                                    <Search className="ml-4 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 h-10 text-base"
                                        placeholder="What do you want to learn today?"
                                    />
                                    <Button size="icon" className="rounded-full h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
                                        <Search className="h-4 w-4" />
                                        <span className="sr-only">Search</span>
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="font-medium">Popular:</span>
                                {['Python', 'React', 'Data Science', 'Marketing'].map((tag) => (
                                    <Link key={tag} href="#" className="hover:text-primary hover:underline decoration-primary/30 underline-offset-4 transition-all hover:scale-105 inline-block">
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 pt-4">
                            <div className="flex -space-x-4 rtl:space-x-reverse">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-12 w-12 rounded-full border-2 border-background bg-muted overflow-hidden relative shadow-md hover:z-10 hover:scale-110 transition-transform duration-300">
                                        <Image
                                            src={`https://avatar.vercel.sh/user${i}`}
                                            alt={`User ${i}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-bold text-muted-foreground shadow-md">
                                    +2k
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <svg key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500 drop-shadow-sm" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Trusted by 2,000+ students</p>
                            </div>
                        </div>
                    </div>

                    {/* Right side - 3D Element Placeholder or Empty for background visibility */}
                    <div className="hidden lg:block relative h-[600px] w-full animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                        {/* The background image covers this, but we can add floating elements here if needed */}
                    </div>
                </div>
            </div>
        </section>
    );
}
