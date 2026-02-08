"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            {/* Layered gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-primary/[0.03] to-accent/[0.06]" />
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.15]" />

            {/* Radial glow center */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.08] blur-[120px]" />

            {/* Decorative orbs */}
            <div className="pointer-events-none absolute top-10 left-10 h-32 w-32 rounded-full border border-primary/10 animate-float" />
            <div className="pointer-events-none absolute bottom-10 right-10 h-24 w-24 rounded-full border border-accent/10 animate-float [animation-delay:2s]" />
            <div className="pointer-events-none absolute top-1/2 right-1/4 h-16 w-16 rounded-full border border-primary/[0.07] animate-float [animation-delay:4s]" />

            <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8">
                <motion.div
                    className="mx-auto max-w-2xl text-center"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Badge */}
                    <motion.div
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5 text-sm font-medium text-primary"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Free to get started
                    </motion.div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                        Ready to start{" "}
                        <span className="text-primary">
                            learning
                        </span>
                        ?
                    </h2>

                    <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
                        Join thousands of students building real skills with expert-led
                        courses, AI-powered support, and blockchain-verified certificates.
                    </p>

                    <motion.div
                        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <Link href="/courses">
                            <Button
                                size="lg"
                                className="group h-13 px-10 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                            >
                                Browse Courses
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-13 px-10 text-base font-semibold bg-background/60 backdrop-blur-sm"
                            >
                                Create Free Account
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Social proof line */}
                    <motion.p
                        className="mt-8 text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <span className="flex -space-x-1">
                                {["A", "B", "C", "D"].map((seed) => (
                                    <span
                                        key={seed}
                                        className="inline-block h-6 w-6 rounded-full border-2 border-background bg-muted overflow-hidden"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}`}
                                            alt=""
                                            className="h-full w-full"
                                        />
                                    </span>
                                ))}
                            </span>
                            Joined by <strong className="text-foreground font-semibold">2,000+</strong> learners this month
                        </span>
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
}
