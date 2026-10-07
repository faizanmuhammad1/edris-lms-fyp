"use client";

import { useState, useRef, useEffect, useCallback, useMemo, useId } from "react";
import {
  X,
  Send,
  Bot,
  MessageCircle,
  Lightbulb,
  BookOpen,
  BrainCircuit,
  ArrowDown,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  videoTimestamp?: number;
}

interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  timestamp: number | null;
  createdAt: string;
}

export interface LessonChatbotPanelProps {
  id: string;
  open: boolean;
  onClose: () => void;
  lessonId: string;
  /** Callback that returns the current video playback time in seconds (avoids re-renders) */
  getVideoTimestamp?: () => number;
  /** Whether the lesson has a completed transcript available */
  hasTranscript?: boolean;
  /** Seek the video player to a specific timestamp (seconds) */
  onSeekVideo?: (seconds: number) => void;
}

// ── Quick suggestions ────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  { icon: Lightbulb, text: "Explain this concept simply" },
  { icon: BookOpen, text: "Summarize the key points so far" },
  { icon: BrainCircuit, text: "Give me a practice question" },
  { icon: MessageCircle, text: "I didn't get this part" },
];

const INTRO_SUGGESTIONS = [
  { icon: MessageCircle, text: "Hi! I'm new to this topic" },
  { icon: BrainCircuit, text: "I have some background in this" },
  { icon: BookOpen, text: "Just want to review the basics" },
  { icon: Lightbulb, text: "I'm preparing for an exam" },
];

// ── Thinking phrases (rotate while waiting for first delta) ──────────────────

const THINKING_PHRASES = [
  "Reading through the transcript...",
  "Thinking about how to explain this...",
  "Looking at what the instructor covered...",
  "Finding the right way to put this...",
  "Checking the lesson context...",
];

// ── Timestamp click helpers ──────────────────────────────────────────────────

const TIMESTAMP_REGEX = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;

function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

function toMessage(m: HistoryMessage): Message {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    videoTimestamp: m.timestamp ?? undefined,
    timestamp: new Date(m.createdAt),
  };
}

/** Tracks the visual viewport so the full-screen phone panel stays above the on-screen keyboard. */
function useVisualViewport(active: boolean) {
  const [viewport, setViewport] = useState<{ height: number; offsetTop: number } | null>(null);

  useEffect(() => {
    if (!active || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setViewport({ height: vv.height, offsetTop: vv.offsetTop });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);

  return viewport;
}

// ── Component ────────────────────────────────────────────────────────────────

export function LessonChatbotPanel({
  id,
  open,
  onClose,
  lessonId,
  getVideoTimestamp,
  hasTranscript = false,
  onSeekVideo,
}: LessonChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [historyCursor, setHistoryCursor] = useState<string | undefined>();
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [thinkingPhrase, setThinkingPhrase] = useState(THINKING_PHRASES[0]);

  const panelRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const titleId = useId();
  const inputId = useId();
  const viewport = useVisualViewport(open);

  // Markdown components with clickable timestamps
  const markdownComponents = useMemo<Components>(
    () => ({
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      ul: ({ children }) => <ul className="mb-2 list-inside list-disc space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 list-inside list-decimal space-y-0.5">{children}</ol>,
      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {children}
        </a>
      ),
      code: ({ children, className }) => {
        const isInline = !className;
        if (isInline) {
          return <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>;
        }
        return (
          <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-2.5">
            <code className="font-mono text-xs">{children}</code>
          </pre>
        );
      },
    }),
    []
  );

  // ── Thinking phrase rotation ────────────────────────────────────────────

  const startThinkingRotation = useCallback(() => {
    let idx = 0;
    setThinkingPhrase(THINKING_PHRASES[0]);
    thinkingIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % THINKING_PHRASES.length;
      setThinkingPhrase(THINKING_PHRASES[idx]);
    }, 2000);
  }, []);

  const stopThinkingRotation = useCallback(() => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
  }, []);

  // ── Focus & keyboard ────────────────────────────────────────────────────

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    // Focus the panel (not the textarea) so phones don't pop the keyboard up immediately.
    panel.focus();
    // Native listener on the panel: Escape inside the (portaled) clear-chat dialog won't reach it.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // ── Scroll helpers ──────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, isStreaming, open, scrollToBottom]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // ── Load chat history when opening for the first time ───────────────────

  useEffect(() => {
    if (!open || historyLoaded) return;
    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setHistoryError(false);
      try {
        const res = await fetch(`/api/tutor/history?lessonId=${encodeURIComponent(lessonId)}`);
        if (!res.ok) throw new Error("history");
        const data = await res.json();
        if (cancelled) return;
        setIntroCompleted(data.introCompleted ?? false);
        setIsNewChat(data.isNewChat ?? true);
        setHistoryCursor(data.nextCursor ?? undefined);
        setHasMoreHistory(data.hasMore ?? false);
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map(toMessage));
        }
      } catch {
        if (!cancelled) setHistoryError(true);
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
          setHistoryLoaded(true);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [open, historyLoaded, lessonId]);

  const retryHistory = () => {
    setHistoryError(false);
    setHistoryLoaded(false);
  };

  // ── Load older messages (pagination) ────────────────────────────────────

  const loadMoreHistory = useCallback(async () => {
    if (!hasMoreHistory || isLoadingMore || !historyCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/tutor/history?lessonId=${encodeURIComponent(lessonId)}&cursor=${encodeURIComponent(historyCursor)}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setHistoryCursor(data.nextCursor ?? undefined);
        setHasMoreHistory(data.hasMore ?? false);
        if (data.messages?.length > 0) {
          const olderMessages: Message[] = data.messages.map(toMessage);
          setMessages((prev) => [...olderMessages, ...prev]);
        }
      }
    } catch {
      // Keep the button so the student can try again.
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMoreHistory, isLoadingMore, historyCursor, lessonId]);

  // ── Clear chat history ──────────────────────────────────────────────────

  const handleClearChat = useCallback(async (): Promise<boolean> => {
    if (isClearing) return false;
    setIsClearing(true);
    try {
      const res = await fetch(`/api/tutor/history?lessonId=${encodeURIComponent(lessonId)}`, {
        method: "DELETE",
      });

      if (!res.ok) return false;
      setMessages([]);
      setIsNewChat(true);
      setIntroCompleted(false);
      setHistoryCursor(undefined);
      setHasMoreHistory(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsClearing(false);
    }
  }, [isClearing, lessonId]);

  // ── Send message + stream response ──────────────────────────────────────

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text || input).trim();
      if (!messageText || isStreaming) return;

      const videoTs = getVideoTimestamp?.() ?? 0;

      // Determine if this is the student's intro response (first message in new chat)
      const sendAsIntro = isNewChat && !introCompleted && messages.length === 0;

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
        videoTimestamp: videoTs,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      startThinkingRotation();

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Placeholder for the assistant streaming response
      const assistantId = uuidv4();
      let firstDeltaReceived = false;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date(), videoTimestamp: videoTs },
      ]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const setAssistantContent = (content: string) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content } : m)));

      try {
        const res = await fetch("/api/tutor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            message: messageText,
            videoTimestamp: videoTs,
            isIntroResponse: sendAsIntro,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to get response");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "delta") {
                if (!firstDeltaReceived) {
                  firstDeltaReceived = true;
                  stopThinkingRotation();
                }
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.content } : m))
                );
              } else if (event.type === "done") {
                if (event.introCompleted) {
                  setIntroCompleted(true);
                }
                setIsNewChat(false);
              } else if (event.type === "error") {
                setAssistantContent("Sorry, I ran into a problem answering that. Please try again.");
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setAssistantContent("Sorry, something went wrong. Please check your connection and try again.");
        }
      } finally {
        stopThinkingRotation();
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [input, isStreaming, lessonId, isNewChat, introCompleted, messages.length, getVideoTimestamp, startThinkingRotation, stopThinkingRotation]
  );

  // ── Proactive nudge — suggest help after 5 min of inactivity ────────────

  const lastInteractionRef = useRef(0);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    lastInteractionRef.current = Date.now();
    if (messages.length > 0) setNudgeMessage(null);
  }, [messages.length]);

  useEffect(() => {
    if (!open || !hasTranscript || isStreaming) {
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
      return;
    }

    nudgeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastInteractionRef.current;
      if (elapsed >= 5 * 60 * 1000 && !nudgeMessage) {
        setNudgeMessage("You've been watching for a while. Need help with anything? I'm here if something's unclear!");
      }
    }, 30_000);

    return () => {
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
    };
  }, [open, hasTranscript, isStreaming, nudgeMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
    };
  }, []);

  if (!open) return null;

  const hasMessages = messages.length > 0;
  const suggestions = isNewChat && !introCompleted ? INTRO_SUGGESTIONS : QUICK_SUGGESTIONS;
  const lastMessage = messages[messages.length - 1];
  const isThinking = isStreaming && lastMessage?.role === "assistant" && lastMessage.content === "";

  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      style={
        viewport
          ? ({ "--vvh": `${viewport.height}px`, "--vvt": `${viewport.offsetTop}px` } as React.CSSProperties)
          : undefined
      }
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden bg-background outline-none animate-in fade-in-0",
        // Phones: full screen, sized to the visual viewport so the keyboard never hides the input.
        "inset-x-0 top-[var(--vvt,0px)] h-[var(--vvh,100dvh)]",
        // Larger screens: floating panel above the launcher.
        "sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-24 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:shadow-xl"
      )}
    >
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15" aria-hidden="true">
            <Bot className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold">
              EDRIS AI Tutor
            </h2>
            <p className="truncate text-xs text-primary-foreground/80">
              {hasTranscript ? "Ask anything about this lesson" : "Transcript processing: limited context"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ConfirmDialog
            title="Clear chat history?"
            description="This permanently deletes your conversation with the tutor for this lesson."
            confirmLabel="Clear history"
            destructive
            onConfirm={handleClearChat}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                disabled={isClearing || messages.length === 0 || isStreaming}
                aria-label="Clear chat history"
              >
                {isClearing ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 aria-hidden="true" />
                )}
              </Button>
            }
          />
          <Button
            size="icon"
            variant="ghost"
            className="size-10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            onClick={onClose}
            aria-label="Close AI tutor"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={chatContainerRef}
          className="h-full overflow-y-auto overscroll-contain"
          role="log"
          aria-live="polite"
          aria-busy={isStreaming || isLoadingHistory}
          aria-label="Conversation with the AI tutor"
        >
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
              Loading your conversation…
            </div>
          ) : historyError && !hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-muted-foreground">We couldn&apos;t load your previous conversation.</p>
              <Button variant="outline" onClick={retryHistory}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : !hasMessages ? (
            /* ── Welcome State ── */
            <div className="flex min-h-full flex-col items-center justify-center px-5 py-6">
              <div
                className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10"
                aria-hidden="true"
              >
                <BrainCircuit className="size-8 text-primary" />
              </div>

              <div className="mb-6 text-center">
                {isNewChat && !introCompleted ? (
                  <>
                    <h3 className="mb-1.5 text-lg font-semibold text-foreground">
                      Hey! I&apos;m your tutor for this lesson
                    </h3>
                    <p className="max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                      Before we start, tell me a bit about yourself. What&apos;s your experience level with this
                      topic?
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="mb-1.5 text-lg font-semibold text-foreground">Welcome back! Ready to learn?</h3>
                    <p className="max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                      I know where you are in the video. Ask me anything about the lesson!
                    </p>
                  </>
                )}
              </div>

              <div className="grid w-full grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => handleSend(suggestion.text)}
                    className="flex min-h-11 items-start gap-2.5 rounded-xl border bg-card p-3 text-left text-sm text-muted-foreground transition-colors outline-none hover:border-primary/30 hover:bg-primary/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <suggestion.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="leading-snug">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages List ── */
            <div className="space-y-5 p-4">
              {hasMoreHistory && (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" onClick={loadMoreHistory} disabled={isLoadingMore}>
                    {isLoadingMore && <Loader2 className="animate-spin" aria-hidden="true" />}
                    {isLoadingMore ? "Loading…" : "Load earlier messages"}
                  </Button>
                </div>
              )}

              {messages.map((msg, idx) => {
                // The thinking indicator covers the empty streaming placeholder.
                if (msg.role === "assistant" && msg.content === "" && isStreaming && idx === messages.length - 1) {
                  return null;
                }
                const isUser = msg.role === "user";

                return (
                  <div key={msg.id} className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium",
                        isUser ? "bg-primary text-primary-foreground" : "border bg-primary/10 text-primary"
                      )}
                      aria-hidden="true"
                    >
                      {isUser ? "You" : <Bot className="size-4" />}
                    </div>

                    <div className="min-w-0 max-w-[85%]">
                      <span className="sr-only">{isUser ? "You said:" : "Tutor said:"}</span>
                      <div
                        className={cn(
                          "px-3.5 py-2.5 text-sm leading-relaxed break-words",
                          isUser
                            ? "rounded-2xl rounded-tr-md bg-primary whitespace-pre-wrap text-primary-foreground"
                            : "tutor-markdown rounded-2xl rounded-tl-md border bg-card text-foreground"
                        )}
                      >
                        {isUser ? (
                          msg.content
                        ) : (
                          <MarkdownWithTimestamps
                            content={msg.content}
                            components={markdownComponents}
                            onSeekVideo={onSeekVideo}
                          />
                        )}
                      </div>
                      <p
                        className={cn(
                          "mt-1 px-1 text-[11px] text-muted-foreground",
                          isUser ? "text-right" : "text-left"
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex gap-2.5">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border bg-card px-4 py-3">
                    <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground italic">{thinkingPhrase}</span>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {showScrollDown && hasMessages && (
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToBottom}
            aria-label="Scroll to latest message"
            className="absolute bottom-3 left-1/2 z-10 size-10 -translate-x-1/2 rounded-full bg-card shadow-md hover:scale-100"
          >
            <ArrowDown aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* ── Inline Suggestion Chips ── */}
      {hasMessages && !isStreaming && (
        <div className="shrink-0 px-4 pb-2">
          <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-1">
            {QUICK_SUGGESTIONS.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion.text}
                type="button"
                onClick={() => handleSend(suggestion.text)}
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground transition-colors outline-none hover:border-primary/30 hover:bg-primary/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <suggestion.icon className="size-3" aria-hidden="true" />
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Proactive Nudge ── */}
      {nudgeMessage && !isStreaming && (
        <div className="shrink-0 px-4 pb-2" role="status">
          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
            <BrainCircuit className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-xs leading-relaxed text-foreground/80">{nudgeMessage}</p>
              <button
                type="button"
                onClick={() => setNudgeMessage(null)}
                className="mt-1 min-h-6 text-xs text-muted-foreground underline hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="shrink-0 border-t bg-card/30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor={inputId} className="sr-only">
            Message the AI tutor
          </label>
          <textarea
            id={inputId}
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isNewChat && !introCompleted && messages.length === 0
                ? "Tell me about yourself..."
                : "Ask your AI tutor..."
            }
            rows={1}
            maxLength={2000}
            enterKeyHint="send"
            className="max-h-[120px] min-h-10 flex-1 resize-none rounded-xl border bg-background px-3.5 py-2 text-base placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            aria-label={isStreaming ? "Waiting for the tutor's reply" : "Send message"}
            className="size-10 shrink-0 rounded-xl hover:scale-100"
          >
            {isStreaming ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          </Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI Tutor can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

// ── Markdown renderer with clickable timestamps ──────────────────────────────

function MarkdownWithTimestamps({
  content,
  components,
  onSeekVideo,
}: {
  content: string;
  components: Components;
  onSeekVideo?: (seconds: number) => void;
}) {
  const parts = onSeekVideo ? content.split(TIMESTAMP_REGEX) : [content];

  if (parts.length === 1) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    );
  }

  // The split result alternates: [text, match, text, match, ...]
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) {
          return part ? (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={components}>
              {part}
            </ReactMarkdown>
          ) : null;
        }
        const seconds = parseTimestampToSeconds(part);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSeekVideo?.(seconds)}
            className="mx-0.5 inline-flex min-h-6 items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            aria-label={`Jump the video to ${part}`}
          >
            <span aria-hidden="true">▶ {part}</span>
          </button>
        );
      })}
    </>
  );
}
