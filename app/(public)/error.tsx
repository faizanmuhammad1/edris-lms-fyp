"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function PublicError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Public Page Error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
            <div className="max-w-md space-y-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
                    <p className="text-muted-foreground">
                        We couldn&apos;t load this page. This is usually temporary — please try again.
                    </p>
                    {error.digest && (
                        <p className="font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
                    )}
                </div>

                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Button onClick={reset} className="h-11">
                        <RefreshCw aria-hidden="true" />
                        Try again
                    </Button>
                    <Link href="/" className={buttonVariants({ variant: "outline", className: "h-11" })}>
                        <Home aria-hidden="true" />
                        Go home
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground">
                    Still stuck?{" "}
                    <Link href="/contact" className="font-medium text-primary hover:underline">
                        Contact support
                    </Link>
                </p>
            </div>
        </div>
    );
}
