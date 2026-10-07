"use client";

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
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div role="alert" className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t load this page. This is usually temporary, so please try again.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} size="lg">
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard/courses">
              <BookOpen aria-hidden="true" />
              My courses
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/">
              <Home aria-hidden="true" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
