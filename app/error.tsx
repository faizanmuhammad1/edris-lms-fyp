"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

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
        <main className="flex min-h-svh items-center justify-center bg-background px-4 py-16">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
                </div>

                <h1 className="mt-6 text-3xl font-semibold tracking-tight">Something went wrong</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    An unexpected error occurred. Please try again — if it keeps happening, let us know.
                </p>
                {error.digest && (
                    <p className="mt-3 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
                )}

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button size="lg" onClick={reset} className="h-11">
                        <RefreshCw aria-hidden="true" />
                        Try again
                    </Button>
                    <Link href="/" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11" })}>
                        <Home aria-hidden="true" />
                        Go home
                    </Link>
                </div>

                <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
                    If the problem persists, please{" "}
                    <Link href="/contact" className="font-medium text-primary hover:underline">
                        contact support
                    </Link>
                    {error.digest ? " and include the error ID above." : "."}
                </p>
            </div>
        </main>
    );
}
