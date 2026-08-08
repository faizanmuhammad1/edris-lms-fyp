"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error("Auth Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>
                    <CardTitle>Authentication Error</CardTitle>
                    <CardDescription>
                        Something went wrong during authentication. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Button onClick={reset} className="w-full gap-2">
                        <RefreshCw className="size-4" />
                        Try Again
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/login")} className="w-full gap-2">
                        <ArrowLeft className="size-4" />
                        Back to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
