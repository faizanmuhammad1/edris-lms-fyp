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
import { motion } from "framer-motion";

const categories = [
    {
        title: "Development",
        icon: Code,
        href: "/courses?category=Development",
        count: "120+ courses",
        gradient: "from-blue-500/10 to-blue-600/5",
        iconBg: "bg-blue-500/10 group-hover:bg-blue-500/20",
        iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
        title: "Business",
        icon: Briefcase,
        href: "/courses?category=Business",
        count: "80+ courses",
        gradient: "from-amber-500/10 to-amber-600/5",
        iconBg: "bg-amber-500/10 group-hover:bg-amber-500/20",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
        title: "Finance",
        icon: BarChart3,
        href: "/courses?category=Finance+%26+Accounting",
        count: "60+ courses",
        gradient: "from-emerald-500/10 to-emerald-600/5",
        iconBg: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
        iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
        title: "IT & Software",
        icon: Monitor,
        href: "/courses?category=IT+%26+Software",
        count: "90+ courses",
        gradient: "from-violet-500/10 to-violet-600/5",
        iconBg: "bg-violet-500/10 group-hover:bg-violet-500/20",
        iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
        title: "Design",
        icon: Palette,
        href: "/courses?category=Design",
        count: "70+ courses",
        gradient: "from-pink-500/10 to-pink-600/5",
        iconBg: "bg-pink-500/10 group-hover:bg-pink-500/20",
        iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
        title: "Marketing",
        icon: Megaphone,
        href: "/courses?category=Marketing",
        count: "50+ courses",
        gradient: "from-orange-500/10 to-orange-600/5",
        iconBg: "bg-orange-500/10 group-hover:bg-orange-500/20",
        iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
        title: "Health & Fitness",
        icon: Heart,
        href: "/courses?category=Health+%26+Fitness",
        count: "40+ courses",
        gradient: "from-red-500/10 to-red-600/5",
        iconBg: "bg-red-500/10 group-hover:bg-red-500/20",
        iconColor: "text-red-600 dark:text-red-400",
    },
    {
        title: "Music",
        icon: Music,
        href: "/courses?category=Music",
        count: "30+ courses",
        gradient: "from-cyan-500/10 to-cyan-600/5",
        iconBg: "bg-cyan-500/10 group-hover:bg-cyan-500/20",
        iconColor: "text-cyan-600 dark:text-cyan-400",
    },
];

export function CategoriesSection() {
    return (
        <section className="py-20 md:py-28 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                            Browse by Topic
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            Explore Categories
                        </h2>
                        <p className="mt-3 text-muted-foreground text-lg max-w-lg">
                            Find the perfect course in any subject that interests you.
                        </p>
                    </div>
                    <Link
                        href="/courses"
                        className="group inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        View all
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </motion.div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                            <Link href={category.href} className="group block">
                                <div
                                    className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/25 hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5`}
                                >
                                    {/* Gradient fill on hover */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                    />

                                    <div className="relative z-10 flex items-center gap-4">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${category.iconBg} transition-colors duration-300`}
                                        >
                                            <category.icon
                                                className={`h-5 w-5 ${category.iconColor} transition-transform duration-300 group-hover:scale-110`}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                {category.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {category.count}
                                            </p>
                                        </div>
                                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/40 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
