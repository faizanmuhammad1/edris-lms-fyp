"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import { Facebook, Twitter, Instagram, Linkedin, Globe, Mail, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

            {/* Animated Gradient Orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

            {/* Main Content */}
            <div className="relative z-10">
                {/* Newsletter Section */}
                <div className="border-b border-border/50">
                    <div className="container mx-auto px-4 md:px-6 py-12">
                        <div className="backdrop-blur-xl bg-card/30 border border-border/50 rounded-2xl p-8 md:p-12 shadow-2xl">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                <div className="text-center lg:text-left space-y-3">
                                    <div className="flex items-center justify-center lg:justify-start gap-2 text-primary">
                                        <Sparkles className="size-5" />
                                        <span className="text-sm font-medium uppercase tracking-wider">Newsletter</span>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Stay updated with Edris LMS
                                    </h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Get the latest courses, learning tips, and exclusive offers delivered to your inbox.
                                    </p>
                                </div>
                                <div className="w-full lg:w-auto">
                                    <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                className="pl-10 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 rounded-xl"
                                            />
                                        </div>
                                        <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group">
                                            Subscribe
                                            <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Links Section */}
                <div className="container mx-auto px-4 md:px-6 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
                        {/* Brand Column */}
                        <div className="col-span-2 md:col-span-2 space-y-6">
                            <Link href="/" className="flex items-center space-x-3 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-all" />
                                    <Image src={Logo} alt="Edris LMS Logo" className="relative size-10" />
                                </div>
                                <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                    Edris LMS
                                </span>
                            </Link>

                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                                Empowering learners worldwide with high-quality courses and a modern learning experience.
                            </p>

                            {/* Social Links */}
                            <div className="flex gap-2">
                                {[
                                    { icon: Instagram, href: "#", label: "Instagram" },
                                    { icon: Twitter, href: "#", label: "Twitter" },
                                    { icon: Linkedin, href: "#", label: "LinkedIn" },
                                    { icon: Facebook, href: "#", label: "Facebook" },
                                ].map((social) => (
                                    <Link
                                        key={social.label}
                                        href={social.href}
                                        className="group relative p-2.5 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                                        aria-label={social.label}
                                    >
                                        <social.icon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </Link>
                                ))}
                            </div>

                            {/* Language Selector */}
                            <button className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 rounded-xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/50 transition-all group">
                                <Globe className="size-4 group-hover:text-primary transition-colors" />
                                <span>English (US)</span>
                            </button>
                        </div>

                        {/* Categories */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Categories
                            </h4>
                            <ul className="space-y-3 text-sm">
                                {["Development", "Business", "Design", "Marketing", "IT & Software"].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href="#"
                                            className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-1 group"
                                        >
                                            <span className="w-0 group-hover:w-2 h-px bg-primary transition-all" />
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Company
                            </h4>
                            <ul className="space-y-3 text-sm">
                                {[
                                    { label: "About Us", href: "/about" },
                                    { label: "Blog", href: "/blog" },
                                    { label: "Contact Us", href: "/contact" },
                                    { label: "Teach on Edris", href: "/teach" }
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-1 group"
                                        >
                                            <span className="w-0 group-hover:w-2 h-px bg-primary transition-all" />
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Legal
                            </h4>
                            <ul className="space-y-3 text-sm">
                                {[
                                    { label: "Terms", href: "/terms" },
                                    { label: "Privacy", href: "/privacy" },
                                    { label: "Cookies", href: "/cookies" },
                                    { label: "Accessibility", href: "/accessibility" }
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-1 group"
                                        >
                                            <span className="w-0 group-hover:w-2 h-px bg-primary transition-all" />
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border/50">
                    <div className="container mx-auto px-4 md:px-6 py-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-muted-foreground">
                                &copy; {currentYear} Edris LMS Inc. All rights reserved.
                            </p>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <button className="hover:text-primary transition-colors">
                                    Cookie settings
                                </button>
                                <span className="hidden md:inline text-border">|</span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    All systems operational
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

