
"use client";


import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LiveLessonSummaryProps {
    summary: string;
}

export function LiveLessonSummary({ summary }: LiveLessonSummaryProps) {
    const [displayedText, setDisplayedText] = useState("");

    const isTyping = summary && displayedText.length < summary.length;

    useEffect(() => {
        if (summary) {
            const speed = 15; // ms per character
            const intervalId = setInterval(() => {
                setDisplayedText((prev) => {
                    if (prev.length < summary.length) {
                        return summary.slice(0, prev.length + 1);
                    }
                    clearInterval(intervalId);
                    return prev;
                });
            }, speed);

            return () => clearInterval(intervalId);
        }
    }, [summary]);

    if (!summary) {
        return null;
    }

    return (
        <div className="rounded-xl border border-border/60 bg-card/50 p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500",
                        isTyping ? "bg-primary/20 text-primary animate-pulse" : "bg-primary/10 text-primary"
                    )}>
                        {isTyping ? (
                            <Image
                                src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                                alt="Generating"
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain animate-pulse"
                            />
                        ) : (
                            <Image
                                src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                                alt="Edris"
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain"
                            />
                        )}
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                            AI Lesson Summary
                            {isTyping && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-ping" />
                            )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {isTyping ? "Generating live summary..." : "Generated key takeaways"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 min-h-[60px]">
                <p className="text-sm text-foreground/90 leading-relaxed font-light tracking-wide">
                    {displayedText}
                    {isTyping && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-primary/70 animate-pulse align-middle" />
                    )}
                </p>
            </div>
        </div>
    );
}
