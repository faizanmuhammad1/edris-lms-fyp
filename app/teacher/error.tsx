"use client";

import { buttonVariants, Button } from "@/components/ui/button";
import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the original error for monitoring; users only see the friendly message below.
    console.error("Teacher portal error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-12" role="alert">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t load this page. Please try again, or go back to your dashboard.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} className="h-10">
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
          <Link href="/teacher" className={buttonVariants({ variant: "outline", className: "h-10" })}>
            <LayoutDashboard aria-hidden="true" />
            Teacher dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
