"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTimerProps {
  timeLimitMinutes: number | null;
  onTimeUp: () => void;
  isCompleted?: boolean;
}

export function QuizTimer({
  timeLimitMinutes,
  onTimeUp,
  isCompleted = false,
}: QuizTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(() => {
    if (!timeLimitMinutes || isCompleted) return null;
    return timeLimitMinutes * 60;
  });

  useEffect(() => {
    if (!timeLimitMinutes || isCompleted) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimitMinutes, onTimeUp, isCompleted]);

  if (!timeLimitMinutes || isCompleted) {
    return null;
  }

  const minutes = Math.floor((timeRemaining ?? 0) / 60);
  const seconds = (timeRemaining ?? 0) % 60;
  const isLowTime = (timeRemaining ?? 0) < 60; // Less than 1 minute

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
        isLowTime
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400"
          : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400"
      )}
    >
      <Clock className={cn("h-4 w-4", isLowTime && "animate-pulse")} />
      <span className="font-mono text-sm font-semibold">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      {isLowTime && (
        <AlertTriangle className="h-4 w-4 animate-pulse ml-1" />
      )}
    </div>
  );
}
