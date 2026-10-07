"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Auth Error:", error);
    }, [error]);

    return (
        <Card className="w-full">
            <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
                <CardDescription className="text-base">
                    We hit a problem while signing you in. Please try again.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Button onClick={reset} className="h-11 w-full">
                    <RefreshCw aria-hidden="true" />
                    Try again
                </Button>
                <Link href="/login" className={buttonVariants({ variant: "outline", className: "h-11 w-full" })}>
                    <ArrowLeft aria-hidden="true" />
                    Back to sign in
                </Link>
            </CardContent>
        </Card>
    );
}
