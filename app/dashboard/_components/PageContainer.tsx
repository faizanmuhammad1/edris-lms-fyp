import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const widths = {
  default: "max-w-7xl",
  medium: "max-w-5xl",
  narrow: "max-w-3xl",
} as const;

/** Standard padding, max width and vertical rhythm for student dashboard pages. */
export function PageContainer({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: keyof typeof widths;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8",
        widths[width],
        className
      )}
    >
      {children}
    </div>
  );
}
