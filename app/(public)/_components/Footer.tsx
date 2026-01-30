"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import { Facebook, Twitter, Instagram, Linkedin, Globe } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-background border-t border-border pt-16 pb-12">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
                    {/* Brand Column - Spans 2 cols on mobile, 2 cols on large screens if needed, but Notion style usually keeps it compact or first */}
                    <div className="col-span-2 md:col-span-2 lg:col-span-1 flex flex-col items-start space-y-6">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <Image src={Logo} alt="Edris LMS Logo" className="size-8" />
                            <span className="font-bold text-xl tracking-tight text-foreground">Edris LMS</span>
                        </Link>

                        <div className="flex gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Instagram className="size-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter className="size-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Linkedin className="size-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Facebook className="size-5" />
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors">
                            <Globe className="size-4" />
                            <span>English (US)</span>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="col-span-1">
                        <h4 className="font-semibold text-foreground mb-4">Categories</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            {["Development", "Business", "Design", "Marketing", "IT & Software"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="hover:text-foreground hover:underline transition-all">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-1">
                        <h4 className="font-semibold text-foreground mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            {[
                                { label: "About Us", href: "/about" },
                                { label: "Blog", href: "/blog" },
                                { label: "Contact Us", href: "/contact" },
                                { label: "Teach on Edris", href: "/teach" }
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="hover:text-foreground hover:underline transition-all">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-1">
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            {[
                                { label: "Terms", href: "/terms" },
                                { label: "Privacy", href: "/privacy" },
                                { label: "Cookies", href: "/cookies" },
                                { label: "Accessibility", href: "/accessibility" }
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="hover:text-foreground hover:underline transition-all">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-muted-foreground">
                    <p>&copy; {currentYear} Edris LMS Inc.</p>

                    {/* Optional: Add simplified links or status here if desired, Notion puts Cookie settings here */}
                    <span className="hover:text-foreground cursor-pointer transition-colors">Cookie settings</span>
                </div>
            </div>
        </footer>
    );
}
