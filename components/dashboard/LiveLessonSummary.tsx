"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface LiveLessonSummaryProps {
  summary: string;
}

const CHARS_PER_TICK = 3;
const TICK_MS = 15;

export function LiveLessonSummary({ summary }: LiveLessonSummaryProps) {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    if (!summary) return;
    // Respect reduced motion: reveal the whole summary in a single step.
    const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? summary.length : CHARS_PER_TICK;
    const intervalId = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = Math.min(prev + step, summary.length);
        if (next >= summary.length) clearInterval(intervalId);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(intervalId);
  }, [summary]);

  if (!summary) {
    return null;
  }

  const isTyping = displayedLength < summary.length;

  return (
    <section aria-labelledby="lesson-summary-heading" className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
          <Image
            src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
            alt=""
            width={20}
            height={20}
            className="size-5 object-contain"
          />
        </div>
        <div className="space-y-0.5">
          <h2 id="lesson-summary-heading" className="text-base font-semibold text-foreground">
            AI lesson summary
          </h2>
          <p className="text-xs text-muted-foreground">Key takeaways generated from the video</p>
        </div>
      </div>

      {/* Screen readers get the full text immediately; the typing effect is visual only. */}
      <p className="sr-only">{summary}</p>
      <p className="min-h-[60px] text-sm leading-relaxed break-words whitespace-pre-line text-foreground/90" aria-hidden="true">
        {summary.slice(0, displayedLength)}
        {isTyping && <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-primary/70 align-middle" />}
      </p>
    </section>
  );
}
