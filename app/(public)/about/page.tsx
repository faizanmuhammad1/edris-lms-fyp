"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Users, Globe, Award } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-[500px] w-full overflow-hidden flex items-center justify-center">
                <Image
                    src="/about-hero.png"
                    alt="About Edris LMS"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 text-center space-y-6 px-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                        Empowering the Future of Education
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                        Edris LMS is a cutting-edge platform designed to bridge the gap between traditional learning and modern technology.
                    </p>
                </div>
            </div>

            {/* Mission Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm">
                            Our Mission
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                            Democratizing Access to Quality Education
                        </h2>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            We believe that education should be accessible to everyone, everywhere. Our mission is to provide equal opportunities for learners worldwide by leveraging the power of AI and blockchain technology.
                        </p>
                        <ul className="space-y-3 pt-4">
                            {[
                                "AI-Driven Personalized Learning",
                                "Blockchain Verified Credentials",
                                "Global Community Access",
                                "Expert-Led Course Content"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center space-x-3 text-muted-foreground">
                                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-2xl opacity-50" />
                        <div className="grid grid-cols-2 gap-4 relative">
                            <div className="bg-card p-6 rounded-2xl shadow-lg border border-border/50 flex flex-col items-center text-center space-y-3">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-bold text-3xl">50k+</h3>
                                <p className="text-sm text-muted-foreground">Active Learners</p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl shadow-lg border border-border/50 flex flex-col items-center text-center space-y-3 mt-8">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Globe className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-bold text-3xl">100+</h3>
                                <p className="text-sm text-muted-foreground">Countries</p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl shadow-lg border border-border/50 flex flex-col items-center text-center space-y-3 -mt-8">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Award className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-bold text-3xl">1.2k+</h3>
                                <p className="text-sm text-muted-foreground">Certifications</p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl shadow-lg border border-border/50 flex flex-col items-center text-center space-y-3">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <CheckCircle2 className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-bold text-3xl">98%</h3>
                                <p className="text-sm text-muted-foreground">Satisfaction</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Section Placeholder */}
            <div className="bg-muted/30 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12">Meet Our Team</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((member) => (
                            <Card key={member} className="border-none shadow-md overflow-hidden group">
                                <div className="h-64 bg-muted animate-pulse relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {/* Placeholder for team image */}
                                    <div className="flex items-center justify-center h-full text-muted-foreground/50">
                                        Member {member}
                                    </div>
                                </div>
                                <CardContent className="p-6 text-left">
                                    <h3 className="font-bold text-lg">Team Member {member}</h3>
                                    <p className="text-sm text-primary font-medium mb-2">Position Title</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        Passionate about education and technology. Dedicated to building the best learning experience.
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                            join Our Journey
                        </h2>
                        <p className="text-lg text-primary-foreground/90 leading-relaxed">
                            Be part of the education revolution. Whether you&apos;re a learner, instructor, or partner, there&apos;s a place for you at Edris LMS.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button size="lg" variant="secondary" asChild className="font-semibold">
                                <Link href="/courses">
                                    Explore Courses
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold">
                                <Link href="/contact">
                                    Contact Us
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
