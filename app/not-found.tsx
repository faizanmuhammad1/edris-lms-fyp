"use client";

import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
            <div className="text-center space-y-8 max-w-md">
                {/* 404 Number with Gradient */}
                <div className="relative">
                    <h1 className="text-[150px] font-bold leading-none bg-gradient-to-r from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 blur-3xl bg-primary/20 -z-10" />
                </div>

                {/* Error Message */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Page Not Found
                    </h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                    <Button
                        variant="default"
                        size="lg"
                        asChild
                        className="gap-2 min-w-[160px]"
                    >
                        <Link href="/">
                            <Home className="size-4" />
                            Go Home
                        </Link>
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.back()}
                        className="gap-2 min-w-[160px]"
                    >
                        <ArrowLeft className="size-4" />
                        Go Back
                    </Button>
                </div>

                {/* Search Suggestion */}
                <div className="pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Search className="size-4" />
                        Try searching or browse our courses
                    </p>
                    <Button variant="link" asChild className="mt-2">
                        <Link href="/courses">Browse Courses</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
