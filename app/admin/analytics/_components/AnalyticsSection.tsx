import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";

/** A page section with its h2, linked by aria-labelledby. */
export function AnalyticsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="space-y-1">
        <h2 id={headingId} className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Shown in place of a section whose data failed to load; the rest of the page still renders. */
export function SectionError({ what }: { what: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <div className="space-y-0.5 text-sm">
          <p className="font-medium">Couldn&apos;t load {what}</p>
          <p className="text-muted-foreground">Something went wrong on our side. Please try again in a moment.</p>
        </div>
      </div>
      <Link href="/admin/analytics" className={buttonVariants({ variant: "outline", className: "sm:shrink-0" })}>
        <RotateCw className="size-4" aria-hidden="true" />
        Try again
      </Link>
    </div>
  );
}
