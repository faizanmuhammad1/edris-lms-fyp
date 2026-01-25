"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <div className="text-center space-y-8 max-w-md">
                    {/* Critical Error Icon */}
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
                        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-red-500/20 border border-red-500/40">
                            <AlertOctagon className="size-12 text-red-500" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Critical Error
                        </h1>
                        <p className="text-gray-400 max-w-sm mx-auto">
                            A critical error has occurred. Please try refreshing the page.
                        </p>
                        {error.digest && (
                            <p className="text-xs text-gray-500 font-mono">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>

                    {/* Reload Button */}
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={reset}
                        className="gap-2"
                    >
                        <RefreshCw className="size-4" />
                        Reload Page
                    </Button>
                </div>
            </body>
        </html>
    );
}
