"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import WhiteLogo from "@/public/edriswhitelogo.png";
import { Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";
import { NewsletterSubscribe } from "./NewsletterSubscribe";
import {
  verificationPortalLinkProps,
  verificationPortalUrl,
} from "@/lib/verification-portal-url";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative border-t border-border/50 bg-background overflow-hidden pt-24 pb-12">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">

                {/* Floating Action Card (Newsletter) */}
                <div className="relative mb-24 rounded-3xl bg-card border border-border/60 p-8 md:p-12 shadow-2xl shadow-black/5 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

                    <div className="relative z-10 max-w-lg">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Weekly Insights
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
                            Stay ahead of the curve.
                        </h3>
                        <p className="text-muted-foreground text-lg">
                            Get the latest courses, learning tips, and exclusive tech insights delivered directly to your inbox.
                        </p>
                    </div>

                    <div className="relative z-10 w-full md:w-auto min-w-[320px]">
                        <NewsletterSubscribe />
                    </div>
                </div>

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 pb-16">

                    {/* Brand Section */}
                    <div className="md:col-span-5 space-y-6">
                        <Link href="/" className="flex items-center space-x-2 group w-fit">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Image src={Logo} alt="Edris LMS" className="h-16 w-auto relative z-10 dark:hidden" />
                                <Image src={WhiteLogo} alt="Edris LMS" className="h-16 w-auto relative z-10 hidden dark:block" />
                            </div>
                            <span className="font-bold text-3xl tracking-tight text-foreground">
                                Edris LMS
                            </span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed max-w-sm text-lg">
                            Empowering the next generation of builders with expert-led technical education and blockchain-verified credentials.
                        </p>

                        <div className="flex gap-4 pt-2">
                            {[
                                { icon: Instagram, href: "#", label: "Instagram" },
                                { icon: Twitter, href: "#", label: "Twitter" },
                                { icon: Linkedin, href: "#", label: "LinkedIn" },
                                { icon: Facebook, href: "#", label: "Facebook" },
                            ].map((social) => (
                                <Link
                                    key={social.label}
                                    href={social.href}
                                    className="group flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:-translate-y-1 shadow-sm"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {/* Categories */}
                        <div className="space-y-5">
                            <h4 className="text-sm font-bold text-foreground tracking-widest uppercase">Categories</h4>
                            <ul className="space-y-3">
                                {["Development", "Business", "Design", "Marketing", "IT & Software"].map(
                                    (item) => (
                                        <li key={item}>
                                            <Link
                                                href={`/courses?category=${encodeURIComponent(item)}`}
                                                className="group inline-flex items-center text-muted-foreground hover:text-primary transition-colors font-medium"
                                            >
                                                <span>{item}</span>
                                                <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </Link>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        {/* Company */}
                        <div className="space-y-5">
                            <h4 className="text-sm font-bold text-foreground tracking-widest uppercase">Company</h4>
                            <ul className="space-y-3">
                                {[
                                    { label: "About Us", href: "/about" },
                                    { label: "Contact Us", href: "/contact" },
                                    { label: "Teach on Edris", href: "/teach" },
                                    { label: "Verify Certificate", href: verificationPortalUrl() },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="group inline-flex items-center text-muted-foreground hover:text-primary transition-colors font-medium"
                                            {...verificationPortalLinkProps(item.href)}
                                        >
                                            <span>{item.label}</span>
                                            <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="space-y-5">
                            <h4 className="text-sm font-bold text-foreground tracking-widest uppercase">Legal</h4>
                            <ul className="space-y-3">
                                {[
                                    { label: "Terms of Service", href: "/terms" },
                                    { label: "Privacy Policy", href: "/privacy" },
                                    { label: "Cookie Policy", href: "/cookies" },
                                    { label: "Accessibility", href: "/accessibility" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="group inline-flex items-center text-muted-foreground hover:text-primary transition-colors font-medium"
                                        >
                                            <span>{item.label}</span>
                                            <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Massive Watermark */}
            <div className="w-full overflow-hidden flex justify-center mt-8 -mb-10 sm:-mb-16 md:-mb-24 pointer-events-none select-none">
                <span className="text-[12vw] font-black leading-none text-muted/20 dark:text-muted/10 tracking-tighter mix-blend-multiply dark:mix-blend-overlay">
                    EDRIS LMS
                </span>
            </div>

            {/* Floating Bottom Bar (Pill / Tube) */}
            <div className="relative z-10 px-4 md:px-8 pb-8">
                <div className="w-full max-w-[2000px] mx-auto border border-border/60 bg-background/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl rounded-3xl sm:rounded-full px-6 md:px-8 py-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 tracking-wide sm:pl-2">
                        &copy; {currentYear} Edris LMS Inc. All rights reserved.
                    </p>
                    <Link href="/about" className="flex items-center gap-3 text-[13px] font-bold text-primary dark:text-[#86AD94] border border-primary/20 dark:border-[#2A362E] rounded-full px-5 py-2 md:py-1.5 min-h-[36px] bg-primary/5 dark:bg-[#17211C] hover:bg-primary/10 dark:hover:bg-[#1E2E25] transition-colors shadow-sm whitespace-nowrap">
                        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary/20 dark:bg-[#2A362E]">
                            <span className="h-2 w-2 rounded-full bg-primary dark:bg-[#86AD94]"></span>
                        </span>
                        <span className="leading-none pt-px">Edris Learning 2.0 Just Dropped</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
}
