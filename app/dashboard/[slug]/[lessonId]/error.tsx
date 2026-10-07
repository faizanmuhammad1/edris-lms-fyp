"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Lesson-level boundary: keeps the course outline visible while offering a retry. */
export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-16 text-center" role="alert">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-xl font-semibold">We couldn&apos;t load this lesson</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please try again. If the problem continues, pick another lesson from the course outline.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <Button onClick={reset} size="lg" className="mt-6">
        <RefreshCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
