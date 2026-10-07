"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTimerProps {
  timeLimitMinutes: number | null;
  onTimeUp: () => void;
  isCompleted?: boolean;
}

/** Announced to screen readers when the remaining time crosses these marks (seconds). */
const ANNOUNCE_AT = [300, 60, 30];

function formatSpoken(seconds: number) {
  if (seconds >= 60) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
  }
  return `${seconds} seconds remaining`;
}

export function QuizTimer({ timeLimitMinutes, onTimeUp, isCompleted = false }: QuizTimerProps) {
  // Deadline-based so the countdown stays accurate when the tab is throttled (e.g. phones).
  const [deadline] = useState(() => (timeLimitMinutes ? Date.now() + timeLimitMinutes * 60_000 : null));
  const [timeRemaining, setTimeRemaining] = useState<number | null>(() =>
    timeLimitMinutes ? timeLimitMinutes * 60 : null
  );
  const [announcement, setAnnouncement] = useState("");
  const onTimeUpRef = useRef(onTimeUp);
  const firedRef = useRef(false);
  const announcedRef = useRef(new Set<number>());

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!deadline || isCompleted) return;

    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeRemaining(remaining);

      for (const mark of ANNOUNCE_AT) {
        if (remaining <= mark && remaining > 0 && !announcedRef.current.has(mark)) {
          announcedRef.current.add(mark);
          setAnnouncement(formatSpoken(remaining));
        }
      }

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeUpRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, isCompleted]);

  if (!timeLimitMinutes || isCompleted) {
    return null;
  }

  const minutes = Math.floor((timeRemaining ?? 0) / 60);
  const seconds = (timeRemaining ?? 0) % 60;
  const isLowTime = (timeRemaining ?? 0) < 60;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
        isLowTime
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400"
          : "border-border bg-muted/50 text-foreground"
      )}
    >
      {isLowTime ? (
        <AlertTriangle className="size-4" aria-hidden="true" />
      ) : (
        <Clock className="size-4" aria-hidden="true" />
      )}
      <span className="sr-only">Time remaining:</span>
      <span role="timer" className="font-mono text-sm font-semibold tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <span className="sr-only" aria-live="assertive">
        {announcement}
      </span>
    </div>
  );
}
