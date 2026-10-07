"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-10" role="alert">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">This page couldn&apos;t load</h1>
          <p className="text-muted-foreground">
            Something went wrong while loading this admin page. Try again, or go back to the dashboard.
            {error.digest && " If it keeps happening, share the reference below with support."}
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Reference: <span className="select-all">{error.digest}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Admin dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
