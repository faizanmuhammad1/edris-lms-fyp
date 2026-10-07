import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** Optional actions (e.g. "View all") shown beside a left-aligned heading on larger screens. */
  actions?: ReactNode;
  className?: string;
}

/** Shared marketing section header: eyebrow, h2 and supporting copy on one type scale. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  actions,
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

/** Standard page-width container used across the public site. */
export const containerClass = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Standard vertical rhythm for marketing sections. */
export const sectionClass = "py-16 sm:py-20 lg:py-24";
