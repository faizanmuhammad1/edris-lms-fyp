"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const prevPathRef = useRef(pathname);

    // Handle navigation completion
    useEffect(() => {
        // Only run when pathname actually changes (not on mount)
        if (prevPathRef.current !== pathname) {
            // Navigation completed - use queueMicrotask to satisfy ESLint
            queueMicrotask(() => {
                setIsNavigating(false);
                setProgress(100);
            });

            // Clear any running interval
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            const timer = setTimeout(() => {
                setProgress(0);
            }, 200);

            prevPathRef.current = pathname;
            return () => clearTimeout(timer);
        }
    }, [pathname, searchParams]);

    const startProgress = useCallback(() => {
        setIsNavigating(true);
        setProgress(0);

        // Animate progress
        let currentProgress = 0;
        intervalRef.current = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress >= 90) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                setProgress(90);
            } else {
                setProgress(currentProgress);
            }
        }, 100);
    }, []);

    // Listen for click events on links to start the loading indicator
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");

            if (anchor && anchor.href && !anchor.target && !anchor.download) {
                try {
                    const url = new URL(anchor.href);
                    // Only show progress for internal navigation
                    if (url.origin === window.location.origin && url.pathname !== pathname) {
                        startProgress();
                    }
                } catch {
                    // Invalid URL, ignore
                }
            }
        };

        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [pathname, startProgress]);

    if (!isNavigating && progress === 0) return null;

    return (
        <div
            className={cn(
                "fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none",
                isNavigating && "animate-pulse"
            )}
        >
            <div
                className={cn(
                    "h-full bg-gradient-to-r from-primary via-primary to-primary/50 transition-all duration-300 ease-out",
                    progress === 100 && "opacity-0"
                )}
                style={{ width: `${progress}%` }}
            />
            {isNavigating && (
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/50 to-transparent animate-pulse" />
            )}
        </div>
    );
}

