"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, BookOpen } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard Error:", error);
    }, [error]);

    return (
        <div className="flex flex-1 items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Dashboard Error</h2>
                    <p className="text-muted-foreground">
                        We couldn&apos;t load your dashboard content. This might be a temporary issue.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground/60 font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} className="gap-2">
                        <RefreshCw className="size-4" />
                        Retry
                    </Button>
                    <Button variant="outline" asChild className="gap-2">
                        <Link href="/dashboard">
                            <BookOpen className="size-4" />
                            My Courses
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild className="gap-2">
                        <Link href="/">
                            <Home className="size-4" />
                            Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
