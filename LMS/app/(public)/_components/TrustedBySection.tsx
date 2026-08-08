"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const partners = [
    { name: "Acme Corp", logo: "https://api.dicebear.com/9.x/initials/svg?seed=AC&backgroundColor=transparent&textColor=64748b" },
    { name: "Global Tech", logo: "https://api.dicebear.com/9.x/initials/svg?seed=GT&backgroundColor=transparent&textColor=64748b" },
    { name: "Nexus Ind.", logo: "https://api.dicebear.com/9.x/initials/svg?seed=NI&backgroundColor=transparent&textColor=64748b" },
    { name: "Quantum", logo: "https://api.dicebear.com/9.x/initials/svg?seed=QU&backgroundColor=transparent&textColor=64748b" },
    { name: "Horizon", logo: "https://api.dicebear.com/9.x/initials/svg?seed=HZ&backgroundColor=transparent&textColor=64748b" },
    { name: "Vertex", logo: "https://api.dicebear.com/9.x/initials/svg?seed=VX&backgroundColor=transparent&textColor=64748b" },
];

export function TrustedBySection() {
    const sectionRef = useRef<HTMLElement>(null);
    const marqueeRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Fade in entire section
        gsap.from(sectionRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 90%",
            }
        });

        // Infinite marquee animation using GSAP
        if (marqueeRef.current) {
            const track = marqueeRef.current.children[0] as HTMLElement;
            const trackWidth = track.scrollWidth / 2; // Since we duplicated the items

            gsap.to(track, {
                x: () => -trackWidth,
                duration: 25,
                ease: "none",
                repeat: -1,
                modifiers: {
                    x: gsap.utils.unitize(x => parseFloat(x) % trackWidth)
                }
            });
        }
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="py-12 border-b border-border bg-background overflow-hidden relative">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 mb-6">
                <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Trusted by forward-thinking teams globally
                </p>
            </div>

            {/* Marquee Container */}
            <div ref={marqueeRef} className="relative flex overflow-hidden group">
                {/* Fade edges */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

                <div className="flex w-max items-center gap-16 px-8 flex-nowrap group-hover:[animation-play-state:paused] transition-all duration-300 opacity-60 hover:opacity-100 mix-blend-multiply dark:mix-blend-screen isolate">
                    {/* Render list twice for seamless loop */}
                    {[...partners, ...partners].map((partner, i) => (
                        <div key={`${partner.name}-${i}`} className="flex items-center justify-center shrink-0 w-32 h-12 grayscale transition-all duration-300 hover:grayscale-0">
                            <Image
                                src={partner.logo}
                                alt={`${partner.name} logo`}
                                width={120}
                                height={48}
                                className="object-contain w-full h-full opacity-60 hover:opacity-100 transition-opacity"
                                unoptimized // Using dicebear SVGs
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
