"use client";

import { useCallback, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// The chat panel (markdown rendering, streaming, history) is only downloaded when the
// student first opens the tutor; hovering/focusing the launcher prefetches it.
const loadPanel = () => import("./LessonChatbotPanel");
const LessonChatbotPanel = dynamic(() => loadPanel().then((m) => m.LessonChatbotPanel), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="fixed inset-0 z-50 flex items-center justify-center gap-2 bg-background text-sm text-muted-foreground sm:inset-auto sm:right-6 sm:bottom-24 sm:h-40 sm:w-[400px] sm:rounded-2xl sm:border sm:shadow-xl"
    >
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
      Opening AI tutor…
    </div>
  ),
});

interface LessonChatbotProps {
  lessonId: string;
  /** Callback that returns the current video playback time in seconds (avoids re-renders) */
  getVideoTimestamp?: () => number;
  /** Whether the lesson has a completed transcript available */
  hasTranscript?: boolean;
  /** Seek the video player to a specific timestamp (seconds) */
  onSeekVideo?: (seconds: number) => void;
}

export function LessonChatbot({ lessonId, getVideoTimestamp, hasTranscript = false, onSeekVideo }: LessonChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Keep the panel mounted after the first open so the conversation survives closing it.
  const [hasOpened, setHasOpened] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const prefetch = () => {
    void loadPanel();
  };

  const close = useCallback(() => {
    setIsOpen(false);
    launcherRef.current?.focus();
  }, []);

  return (
    <>
      {hasOpened && (
        <LessonChatbotPanel
          id={panelId}
          open={isOpen}
          onClose={close}
          lessonId={lessonId}
          getVideoTimestamp={getVideoTimestamp}
          hasTranscript={hasTranscript}
          onSeekVideo={onSeekVideo}
        />
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            close();
          } else {
            setHasOpened(true);
            setIsOpen(true);
          }
        }}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        aria-expanded={isOpen}
        aria-controls={hasOpened ? panelId : undefined}
        aria-label={isOpen ? "Close AI tutor" : "Ask AI Tutor"}
        className={cn(
          "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex h-14 items-center gap-2 rounded-2xl px-4 shadow-lg transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:right-6 sm:bottom-6",
          isOpen
            ? "w-14 justify-center bg-muted px-0 text-muted-foreground max-sm:hidden"
            : "bg-primary text-primary-foreground hover:bg-primary-hover"
        )}
      >
        {isOpen ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <>
            <Image src="/edriswhitelogo.png" alt="" width={24} height={24} className="object-contain" />
            <span className="hidden text-sm font-medium sm:inline" aria-hidden="true">
              Ask AI Tutor
            </span>
          </>
        )}
      </button>
    </>
  );
}
