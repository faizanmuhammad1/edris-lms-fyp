import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  /** Icon shown above the title (defaults to an inbox). */
  icon?: LucideIcon;
  /** Simple link action. */
  buttonText?: string;
  href?: string;
  /** Custom action(s), e.g. a button that opens a dialog. Takes precedence over href/buttonText. */
  action?: ReactNode;
  /** Use "h3" when the empty state sits inside a section that already has an h2. */
  titleAs?: "h2" | "h3";
  className?: string;
}

/** Standard empty state: explains why there is no data and offers the next step. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  buttonText,
  href,
  action,
  titleAs: Title = "h2",
  className,
}: EmptyStateProps) {
  const resolvedAction =
    action ??
    (href && buttonText ? (
      <Link href={href} className={buttonVariants()}>
        {buttonText}
      </Link>
    ) : null);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center animate-in fade-in-50",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-7 text-primary" aria-hidden="true" />
      </div>
      <Title className="mt-5 text-lg font-semibold">{title}</Title>
      <p className="mt-2 max-w-md text-sm text-muted-foreground text-balance">{description}</p>
      {resolvedAction && <div className="mt-6 flex flex-wrap justify-center gap-2">{resolvedAction}</div>}
    </div>
  );
}
