"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Play, Users, BookOpen, Award } from "lucide-react";
import { motion } from "framer-motion";

const popularSearches = [
    { label: "Python", category: "Development" },
    { label: "React", category: "Development" },
    { label: "Data Science", category: "Data Science" },
    { label: "Marketing", category: "Marketing" },
    { label: "Design", category: "Design" },
];

const stats = [
    { icon: Users, value: "2,000+", label: "Active Students" },
    { icon: BookOpen, value: "50+", label: "Expert Courses" },
    { icon: Award, value: "500+", label: "Certificates Issued" },
];

export function HeroSection() {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleTagClick = (category: string) => {
        router.push(`/courses?category=${encodeURIComponent(category)}`);
    };

    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 min-h-[90vh] flex items-center">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 to-primary/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-emerald-500/5 rounded-full blur-3xl" />
            </div>

            {/* Background Image with Enhanced Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden z-0">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-primary/30"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${15 + (i % 4) * 20}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.8, 0.2],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-20">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        className="flex flex-col justify-center space-y-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Badge */}
                        <motion.div
                            className="inline-flex items-center self-start rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-emerald-500/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-md shadow-lg hover:shadow-xl transition-all cursor-default"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                            New: AI-Powered Learning Platform
                        </motion.div>

                        {/* Heading */}
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1]">
                                <span className="block text-foreground">Unlock Your</span>
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-primary bg-[length:200%_auto] animate-gradient">
                                    Full Potential
                                </span>
                            </h1>
                            <p className="max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed">
                                Master in-demand skills with expert-led courses. Start learning today and transform your career.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="w-full max-w-lg">
                            <motion.div
                                className="relative group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                            >
                                {/* Glow Effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-emerald-500 to-primary rounded-2xl blur-lg opacity-30 group-hover:opacity-50 group-focus-within:opacity-60 transition-all duration-500" />

                                {/* Search Container */}
                                <div className="relative flex items-center bg-background/80 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-2xl p-2 group-hover:border-primary/40 transition-all duration-300">
                                    <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" />
                                    <Input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 h-12 text-base px-4"
                                        placeholder="What do you want to learn today?"
                                    />
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="rounded-xl h-12 px-6 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg transition-all duration-300 hover:scale-105 shrink-0"
                                    >
                                        <Search className="h-4 w-4 md:mr-2" />
                                        <span className="hidden md:inline">Search</span>
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Popular Tags */}
                            <motion.div
                                className="flex flex-wrap gap-2 mt-4 items-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.6 }}
                            >
                                <span className="text-sm font-medium text-muted-foreground mr-1">Popular:</span>
                                {popularSearches.map((tag) => (
                                    <button
                                        key={tag.label}
                                        type="button"
                                        onClick={() => handleTagClick(tag.category)}
                                        className="text-sm px-3 py-1.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-300 hover:scale-105"
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </motion.div>
                        </form>

                        {/* Stats Cards */}
                        <motion.div
                            className="grid grid-cols-3 gap-4 pt-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    className="relative group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                                >
                                    <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group-hover:-translate-y-1">
                                        <div className="flex flex-col items-center text-center gap-1">
                                            <stat.icon className="h-5 w-5 text-primary mb-1" />
                                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                                                {stat.value}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right Side - Visual Element */}
                    <motion.div
                        className="hidden lg:flex relative h-[600px] items-center justify-center"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                    >
                        {/* Floating Cards */}
                        <motion.div
                            className="absolute top-10 right-10 p-4 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 shadow-xl max-w-[200px]"
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-emerald-500 flex items-center justify-center">
                                    <Play className="h-4 w-4 text-white" fill="white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Start Learning</p>
                                    <p className="text-xs text-muted-foreground">500+ Video Lessons</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute bottom-20 left-0 p-4 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 shadow-xl"
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden"
                                        >
                                            <Image
                                                src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=Student${i}`}
                                                alt={`Student ${i}`}
                                                width={32}
                                                height={32}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <svg key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">2,000+ Happy Students</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute top-1/2 right-0 -translate-y-1/2 p-4 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-500/20 backdrop-blur-md border border-primary/30 shadow-xl"
                            animate={{ x: [0, 10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        >
                            <div className="flex items-center gap-2">
                                <Award className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="font-bold text-lg">Certified</p>
                                    <p className="text-xs text-muted-foreground">Blockchain Verified</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-muted/30 to-transparent" />
        </section>
    );
}
