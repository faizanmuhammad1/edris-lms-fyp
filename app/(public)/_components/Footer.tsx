"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import { Facebook, Twitter, Instagram, Linkedin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-muted/20 border-t border-border/40 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full pointing-events-none -z-10" />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    {/* Brand Section - 3 Columns */}
                    <div className="lg:col-span-3 space-y-6">
                        <Link href="/" className="flex items-center space-x-2 group w-fit">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Image src={Logo} alt="Edris LMS Logo" className="size-10 relative z-10" />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-foreground">Edris LMS</span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed max-w-xs">
                            Empowering learners worldwide with AI-driven education and blockchain-verified credentials.
                        </p>

                        <div className="flex gap-3">
                            {[
                                { icon: Facebook, href: "#" },
                                { icon: Twitter, href: "#" },
                                { icon: Instagram, href: "#" },
                                { icon: Linkedin, href: "#" }
                            ].map((social, idx) => (
                                <Link
                                    key={idx}
                                    href={social.href}
                                    className="h-9 w-9 rounded-full bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm hover:shadow-primary/20 hover:-translate-y-1"
                                >
                                    <social.icon className="size-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Section - 6 Columns */}
                    <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <h4 className="font-bold text-foreground">Categories</h4>
                            <ul className="space-y-2.5 text-sm text-muted-foreground">
                                {["Development", "Business", "Design", "Marketing", "IT & Software"].map((item) => (
                                    <li key={item}>
                                        <Link href="#" className="hover:text-primary transition-colors flex items-center gap-1 group">
                                            <span className="w-0 group-hover:w-2 h-px bg-primary transition-all duration-300" />
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-foreground">Company</h4>
                            <ul className="space-y-2.5 text-sm text-muted-foreground">
                                {[
                                    { label: "About Us", href: "/about" },
                                    { label: "Blog", href: "/blog" },
                                    { label: "Contact Us", href: "/contact" },
                                    { label: "Teach on Edris", href: "/teach" }
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link href={item.href} className="hover:text-primary transition-colors flex items-center gap-1 group">
                                            <span className="w-0 group-hover:w-2 h-px bg-primary transition-all duration-300" />
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-4 col-span-2 md:col-span-1">
                        <h4 className="font-bold text-foreground">Legal</h4>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            {[
                                { label: "Terms", href: "/terms" },
                                { label: "Privacy", href: "/privacy" },
                                { label: "Cookies", href: "/cookies" },
                                { label: "Accessibility", href: "/accessibility" }
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="hover:text-primary transition-colors flex items-center gap-1 group">
                                        <span className="w-0 group-hover:w-2 h-px bg-primary transition-all duration-300" />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Newsletter Section - 3 Columns */}
                <div className="lg:col-span-3 space-y-6 bg-card/50 p-6 rounded-2xl border border-border/50 backdrop-blur-sm h-fit">
                    <h4 className="font-bold text-foreground">Stay Updated</h4>
                    <p className="text-sm text-muted-foreground">
                        Subscribe to our newsletter for the latest courses and updates.
                    </p>
                    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                        <div className="relative">
                            <Input
                                placeholder="Enter your email"
                                className="pr-10 bg-background/50 border-border/60 focus-visible:ring-primary/20"
                            />
                            <Send className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        </div>
                        <Button className="w-full shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                            Subscribe
                        </Button>
                    </form>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <p>&copy; {currentYear} Edris LMS. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    <div className="flex items-center gap-2 border px-3 py-1 rounded-full bg-background/50">
                        <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium">Systems Normal</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
