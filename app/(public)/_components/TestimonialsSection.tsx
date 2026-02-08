"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Software Engineer",
        content:
            "The AI assistant is a game changer. I can ask questions about the video content in real-time and get clear explanations — it's like having a tutor on call.",
        avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=sarah-johnson",
        rating: 5,
        featured: true,
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Data Scientist",
        content:
            "I love the blockchain-verified certificates. It gives me something concrete to show employers, and they can verify it instantly. Really sets Edris apart.",
        avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=michael-chen",
        rating: 5,
        featured: false,
    },
    {
        id: 3,
        name: "Emily Davis",
        role: "Product Manager",
        content:
            "The course quality is excellent and the platform is genuinely intuitive. I completed two courses in a month — best online learning experience I've had.",
        avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=emily-davis",
        rating: 5,
        featured: false,
    },
];

export function TestimonialsSection() {
    return (
        <section className="relative py-20 md:py-28 bg-background overflow-hidden">
            {/* Subtle ambient glow */}
            <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] bg-primary/[0.04] rounded-full blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] bg-accent/[0.04] rounded-full blur-[100px]" />

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
                        Testimonials
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Trusted by learners{" "}
                        <span className="text-primary">worldwide</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                        See what our students have to say about their learning experience on Edris.
                    </p>
                </motion.div>

                {/* Testimonial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={
                                testimonial.featured
                                    ? "md:row-span-1"
                                    : ""
                            }
                        >
                            <Card
                                className={`group relative h-full overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.05] ${
                                    testimonial.featured
                                        ? "border-primary/20 bg-gradient-to-br from-primary/[0.03] to-card hover:border-primary/35"
                                        : "border-border bg-card hover:border-primary/20"
                                }`}
                            >
                                {/* Top accent */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Large decorative quote */}
                                <div className="absolute -top-2 -right-2 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                                    <Quote className="h-28 w-28 text-primary rotate-12" />
                                </div>

                                <CardContent className="relative z-10 p-8 flex flex-col gap-5 h-full">
                                    {/* Stars */}
                                    <div className="flex gap-0.5">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="h-4 w-4 fill-amber-500 text-amber-500"
                                            />
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <p className="text-foreground leading-relaxed flex-1 text-[15px]">
                                        &ldquo;{testimonial.content}&rdquo;
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-border/70">
                                        <div className="relative">
                                            <div className="absolute -inset-0.5 rounded-full bg-primary opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm" />
                                            <Avatar className="relative h-11 w-11 border-2 border-background">
                                                <AvatarImage src={testimonial.avatar} />
                                                <AvatarFallback>
                                                    {testimonial.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {testimonial.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {testimonial.role}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
