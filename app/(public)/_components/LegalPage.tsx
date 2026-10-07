import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Shared layout for policy pages: readable measure, one h1, h2 per section. */
export function LegalPage({ title, subtitle, children }: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <header className="border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
      </header>
      <div className="mt-10 space-y-10 text-base leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:font-medium [&_h3]:text-foreground [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </div>
  );
}
