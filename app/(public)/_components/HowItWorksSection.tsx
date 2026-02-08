"use client";

import { Search, PlayCircle, BadgeCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    return (
        <section id="how-it-works" className="relative py-20 md:py-28 bg-muted/30 overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.15]" />

            <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="mx-auto max-w-2xl text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                        How It Works
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Three steps to a new skill
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        From browsing to certified — here is how your learning journey unfolds.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {/* Gradient Connecting Line (desktop only) */}
                    <div className="hidden md:block absolute top-[4.5rem] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-0.5">
                        <div className="h-full w-full bg-primary/30 rounded-full" />
                    </div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            className="group relative"
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                        >
                            <div className="relative flex flex-col items-center text-center rounded-2xl border border-border bg-card p-8 pt-10 transition-all duration-300 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/[0.05] hover:-translate-y-1 overflow-hidden">
                                {/* Hover fill */}
                                <div
                                    className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300"
                                />

                                {/* Number Circle */}
                                <div
                                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white font-bold text-xl mb-6 shadow-lg shadow-primary/15 transition-transform duration-300 group-hover:scale-110"
                                >
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                                    <step.icon className="h-6 w-6" />
                                </div>

                                {/* Content */}
                                <h3 className="relative z-10 text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    {step.title}
                                </h3>
                                <p className="relative z-10 text-muted-foreground leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA below steps */}
                <motion.div
                    className="mt-12 text-center"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <Link href="/courses">
                        <Button
                            size="lg"
                            className="group h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20"
                        >
                            Start Learning Now
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
