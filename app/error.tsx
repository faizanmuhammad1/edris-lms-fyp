"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-destructive/5 p-4">
            <div className="text-center space-y-8 max-w-md">
                {/* Error Icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
                    <div className="relative flex items-center justify-center w-full h-full rounded-full bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="size-12 text-destructive" />
                    </div>
                </div>

                {/* Error Message */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Something went wrong!
                    </h1>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        An unexpected error occurred. Don&apos;t worry, our team has been notified and is working on it.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground/60 font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                    <Button
                        variant="default"
                        size="lg"
                        onClick={reset}
                        className="gap-2 min-w-[160px]"
                    >
                        <RefreshCw className="size-4" />
                        Try Again
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="gap-2 min-w-[160px]"
                    >
                        <Link href="/">
                            <Home className="size-4" />
                            Go Home
                        </Link>
                    </Button>
                </div>

                {/* Support Link */}
                <div className="pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                        If the problem persists, please{" "}
                        <Link href="/contact" className="text-primary hover:underline">
                            contact support
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
