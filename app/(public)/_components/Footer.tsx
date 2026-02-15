"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { NewsletterSubscribe } from "./NewsletterSubscribe";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-muted/30">
            {/* Newsletter */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-12 border-b border-border">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Stay updated with Edris
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground max-w-md">
                            Get the latest courses, learning tips, and exclusive offers in your inbox.
                        </p>
                    </div>
                    <NewsletterSubscribe />
                </div>
            </div>

            {/* Links */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image src={Logo} alt="Edris LMS" className="size-8" />
                            <span className="font-bold text-xl tracking-tight text-foreground">
                                Edris LMS
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Empowering learners worldwide with expert-led courses, AI-powered support, and blockchain-verified credentials.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { icon: Instagram, href: "#", label: "Instagram" },
                                { icon: Twitter, href: "#", label: "Twitter" },
                                { icon: Linkedin, href: "#", label: "LinkedIn" },
                                { icon: Facebook, href: "#", label: "Facebook" },
                            ].map((social) => (
                                <Link
                                    key={social.label}
                                    href={social.href}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Categories</h4>
                        <ul className="space-y-2 text-sm">
                            {["Development", "Business", "Design", "Marketing", "IT & Software"].map(
                                (item) => (
                                    <li key={item}>
                                        <Link
                                            href={`/courses?category=${encodeURIComponent(item)}`}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Company</h4>
                        <ul className="space-y-2 text-sm">
                            {[
                                { label: "About Us", href: "/about" },
                                { label: "Contact Us", href: "/contact" },
                                { label: "Teach on Edris", href: "/teach" },
                                { label: "Verify Certificate", href: "/verification" },
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            {[
                                { label: "Terms of Service", href: "/terms" },
                                { label: "Privacy Policy", href: "/privacy" },
                                { label: "Cookie Policy", href: "/cookies" },
                                { label: "Accessibility", href: "/accessibility" },
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border">
                <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        &copy; {currentYear} Edris LMS Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        All systems operational
                    </div>
                </div>
            </div>
        </footer>
    );
}
