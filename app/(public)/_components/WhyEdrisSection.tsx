"use client";

import { Bot, ShieldCheck, Video, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const features = [
    {
        icon: Bot,
        title: "AI-Powered Learning",
        description:
            "Ask questions about any video lesson in real-time. Our AI assistant understands the course content and gives you instant, contextual answers.",
        href: "/courses",
    },
    {
        icon: ShieldCheck,
        title: "Blockchain Certificates",
        description:
            "Every certificate you earn is recorded on the blockchain — tamper-proof, verifiable, and trusted by employers worldwide.",
        href: "/verification",
    },
    {
        icon: Video,
        title: "Expert-Led Video Courses",
        description:
            "Structured, video-first courses built by industry professionals. Learn at your own pace with quizzes and progress tracking.",
        href: "/courses",
    },
];

export function WhyEdrisSection() {
    return (
        <section className="relative py-20 md:py-28 bg-background overflow-hidden">
            {/* Subtle background texture */}
            <div className="absolute inset-0 bg-dot-pattern opacity-[0.2]" />

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
                        Why Edris
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Everything you need to learn{" "}
                        <span className="text-primary">and prove it</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        Edris combines modern technology with great teaching to give you a
                        learning experience that actually works.
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.12 }}
                        >
                            <Link href={feature.href} className="group block h-full">
                                <div className="relative h-full rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1 overflow-hidden">
                                    {/* Top accent line */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                    />

                                    {/* Number watermark */}
                                    <span className="absolute top-4 right-6 text-7xl font-extrabold text-muted/40 select-none leading-none">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>

                                    {/* Icon */}
                                    <div
                                        className="relative z-10 mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/15 transition-transform duration-300 group-hover:scale-110"
                                    >
                                        <feature.icon className="h-6 w-6" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="relative z-10 text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="relative z-10 text-muted-foreground leading-relaxed mb-6">
                                        {feature.description}
                                    </p>

                                    {/* Learn more link */}
                                    <div className="relative z-10 flex items-center text-sm font-medium text-primary opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                                        Learn more
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
