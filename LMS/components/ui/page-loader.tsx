"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
    message?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function PageLoader({
    message = "Loading...",
    className,
    size = "md"
}: PageLoaderProps) {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-10 w-10",
        lg: "h-16 w-16",
    };

    return (
        <div className={cn(
            "flex flex-col items-center justify-center min-h-[400px] w-full gap-4",
            className
        )}>
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
            {message && (
                <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
            )}
        </div>
    );
}
