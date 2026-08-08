"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  Bot,
  MessageCircle,
  Lightbulb,
  BookOpen,
  BrainCircuit,
  ArrowDown,

  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Types ────────────────────────────────────────────────────────────────────

import Image from "next/image";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  videoTimestamp?: number;
}

interface LessonChatbotProps {
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

// ── Component ────────────────────────────────────────────────────────────────

export function LessonChatbot({
  lessonId,
  getVideoTimestamp,
  hasTranscript = false,
  onSeekVideo,
}: LessonChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [historyCursor, setHistoryCursor] = useState<string | undefined>();
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [thinkingPhrase, setThinkingPhrase] = useState(THINKING_PHRASES[0]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Markdown components with clickable timestamps
  const markdownComponents = useMemo<Components>(
    () => ({
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
      ),
      ul: ({ children }) => (
        <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside mb-2 space-y-0.5">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      code: ({ children, className }) => {
        const isInline = !className;
        if (isInline) {
          return (
            <code className="px-1 py-0.5 rounded bg-muted text-[12px] font-mono">
              {children}
            </code>
          );
        }
        return (
          <pre className="bg-muted rounded-lg p-2.5 overflow-x-auto my-2">
            <code className="text-[12px] font-mono">{children}</code>
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

  // ── Scroll helpers ──────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // ── Load chat history when opening for the first time ───────────────────

  useEffect(() => {
    if (!isOpen || historyLoaded) return;

    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/tutor/history?lessonId=${encodeURIComponent(lessonId)}`
        );
        if (res.ok) {
          const data = await res.json();
          setIntroCompleted(data.introCompleted ?? false);
          setIsNewChat(data.isNewChat ?? true);
          setHistoryCursor(data.nextCursor ?? undefined);
          setHasMoreHistory(data.hasMore ?? false);
          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map(
                (m: {
                  id: string;
                  role: string;
                  content: string;
                  timestamp: number | null;
                  createdAt: string;
                }) => ({
                  id: m.id,
                  role: m.role as "user" | "assistant",
                  content: m.content,
                  videoTimestamp: m.timestamp ?? undefined,
                  timestamp: new Date(m.createdAt),
                })
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to load tutor history:", err);
      } finally {
        setIsLoadingHistory(false);
        setHistoryLoaded(true);
      }
    }

    loadHistory();
  }, [isOpen, historyLoaded, lessonId]);

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
          const olderMessages: Message[] = data.messages.map(
            (m: {
              id: string;
              role: string;
              content: string;
              timestamp: number | null;
              createdAt: string;
            }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              videoTimestamp: m.timestamp ?? undefined,
              timestamp: new Date(m.createdAt),
            })
          );
          setMessages((prev) => [...olderMessages, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to load more history:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMoreHistory, isLoadingMore, historyCursor, lessonId]);

  // ── Clear chat history ──────────────────────────────────────────────────

  const handleClearChat = useCallback(async () => {
    if (isClearing) return;
    // Optional: Add a confirmation dialog check here if desired
    if (!window.confirm("Are you sure you want to clear your chat history? This cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch(`/api/tutor/history?lessonId=${encodeURIComponent(lessonId)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages([]);
        setIsNewChat(true);
        setIntroCompleted(false);
        setHistoryCursor(undefined);
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.error("Failed to clear chat history:", err);
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

      // Add user message to UI
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
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          videoTimestamp: videoTs,
        },
      ]);

      // Stream from API
      const controller = new AbortController();
      abortControllerRef.current = controller;

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
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get response");
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
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "delta") {
                if (!firstDeltaReceived) {
                  firstDeltaReceived = true;
                  stopThinkingRotation();
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.content }
                      : m
                  )
                );
              } else if (event.type === "done") {
                // Update intro state from server response
                if (event.introCompleted) {
                  setIntroCompleted(true);
                }
                setIsNewChat(false);
              } else if (event.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                        ...m,
                        content:
                          "Sorry, I encountered an error. Please try again.",
                      }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Tutor chat error:", err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                  ...m,
                  content:
                    "Sorry, something went wrong. Please try again.",
                }
                : m
            )
          );
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

  const lastInteractionRef = useRef(Date.now());
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset interaction timer whenever the student sends a message
  useEffect(() => {
    if (messages.length > 0) {
      lastInteractionRef.current = Date.now();
      setNudgeMessage(null);
    }
  }, [messages.length]);

  // Start/stop nudge timer based on chatbot visibility and transcript
  useEffect(() => {
    if (!isOpen || !hasTranscript || isStreaming) {
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
      return;
    }

    nudgeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastInteractionRef.current;
      // 5 minutes of watching without asking anything
      if (elapsed >= 5 * 60 * 1000 && !nudgeMessage) {
        setNudgeMessage(
          "You've been watching for a while — need help with anything? I'm here if something's unclear!"
        );
      }
    }, 30_000); // Check every 30s

    return () => {
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
    };
  }, [isOpen, hasTranscript, isStreaming, nudgeMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
      if (nudgeTimerRef.current) {
        clearInterval(nudgeTimerRef.current);
      }
    };
  }, []);

  const hasMessages = messages.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="pointer-events-auto mb-4 bg-background/95 backdrop-blur-2xl border border-border/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] rounded-2xl flex flex-col overflow-hidden transition-all duration-300 w-[400px] h-[560px]"

          >
            {/* ── Header ── */}
            <div className="relative shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }}
              />

              <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/10 overflow-hidden">
                      <Image
                        src="/edriswhitelogo.png"
                        alt="AI Tutor"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-primary"></span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-sm tracking-tight">
                      EDRIS AI Tutor
                    </h3>
                    <p className="text-white/70 text-xs">
                      {hasTranscript
                        ? "Ask anything about this lesson"
                        : "Transcript processing — limited context"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Clear Chat Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg h-8 w-8"
                    onClick={handleClearChat}
                    title="Clear chat history"
                    disabled={isClearing || messages.length === 0}
                  >
                    {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={15} />}
                  </Button>


                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg h-8 w-8"
                    onClick={() => setIsOpen(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Chat Area ── */}
            <div className="flex-1 relative min-h-0">
              <div ref={chatContainerRef} className="h-full overflow-y-auto">
                {isLoadingHistory ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                ) : !hasMessages ? (
                  /* ── Welcome State ── */
                  <div className="h-full flex flex-col items-center justify-center px-6 py-8">
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 12, delay: 0.1 }}
                      className="relative mb-6"
                    >
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 flex items-center justify-center">
                        <BrainCircuit size={36} className="text-primary" />
                      </div>
                      <motion.div
                        animate={{ y: [-2, 2, -2] }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-lg bg-accent/20 border border-accent/20 flex items-center justify-center"
                      >
                        <Sparkles size={14} className="text-primary" />
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center mb-8"
                    >
                      {isNewChat && !introCompleted ? (
                        <>
                          <h4 className="text-lg font-semibold text-foreground mb-1.5">
                            Hey! I&apos;m your tutor for this lesson
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                            Before we start, tell me a bit about yourself — what&apos;s
                            your experience level with this topic?
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-lg font-semibold text-foreground mb-1.5">
                            Welcome back! Ready to learn?
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                            I know exactly where you are in the video.
                            Ask me anything about the lesson!
                          </p>
                        </>
                      )}
                    </motion.div>

                    <div className="w-full grid grid-cols-2 gap-2 px-1">
                      {(isNewChat && !introCompleted
                        ? INTRO_SUGGESTIONS
                        : QUICK_SUGGESTIONS
                      ).map((suggestion, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                          onClick={() => handleSend(suggestion.text)}
                          className="group flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-primary/5 hover:border-primary/30 text-left transition-all duration-200 cursor-pointer"
                        >
                          <div className="h-7 w-7 rounded-lg bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors">
                            <suggestion.icon
                              size={14}
                              className="text-primary"
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-snug pt-0.5">
                            {suggestion.text}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ── Messages List ── */
                  <div className="p-4 space-y-5">
                    {/* Load more button for paginated history */}
                    {hasMoreHistory && (
                      <div className="flex justify-center">
                        <button
                          onClick={loadMoreHistory}
                          disabled={isLoadingMore}
                          className="text-[11px] text-muted-foreground hover:text-foreground px-3 py-1 rounded-full border border-border/60 hover:border-primary/30 transition-colors"
                        >
                          {isLoadingMore ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 size={10} className="animate-spin" />
                              Loading...
                            </span>
                          ) : (
                            "Load earlier messages"
                          )}
                        </button>
                      </div>
                    )}

                    {messages.map((msg, idx) => {
                      // Hide the empty assistant placeholder — the thinking indicator handles this state
                      if (
                        msg.role === "assistant" &&
                        msg.content === "" &&
                        isStreaming &&
                        idx === messages.length - 1
                      ) {
                        return null;
                      }

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: idx === messages.length - 1 ? 0.05 : 0,
                          }}
                          className={cn(
                            "flex gap-2.5",
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {/* Avatar */}
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-medium shadow-sm",
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/10 text-primary"
                            )}
                          >
                            {msg.role === "user" ? "You" : <Bot size={16} />}
                          </div>

                          {/* Bubble */}
                          <div
                            className={cn(
                              "max-w-[80%] group relative",
                              msg.role === "user" ? "items-end" : "items-start"
                            )}
                          >
                            <div
                              className={cn(
                                "px-3.5 py-2.5 text-[13px] leading-relaxed",
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md shadow-sm whitespace-pre-wrap"
                                  : "bg-card border border-border/60 text-foreground rounded-2xl rounded-tl-md shadow-xs tutor-markdown"
                              )}
                            >
                              {msg.role === "assistant" ? (
                                <MarkdownWithTimestamps
                                  content={msg.content}
                                  components={markdownComponents}
                                  onSeekVideo={onSeekVideo}
                                />
                              ) : (
                                msg.content
                              )}
                              {/* Streaming cursor */}
                              {msg.role === "assistant" &&
                                isStreaming &&
                                idx === messages.length - 1 && (
                                  <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle rounded-sm" />
                                )}
                            </div>
                            <p
                              className={cn(
                                "text-[10px] mt-1 px-1 text-muted-foreground/60",
                                msg.role === "user" ? "text-right" : "text-left"
                              )}
                            >
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Thinking indicator (shows before first delta with rotating phrases) */}
                    {isStreaming &&
                      messages.length > 0 &&
                      messages[messages.length - 1].role === "assistant" &&
                      messages[messages.length - 1].content === "" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2.5"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
                            <Bot size={16} />
                          </div>
                          <div className="bg-card border border-border/60 px-4 py-3 rounded-2xl rounded-tl-md shadow-xs">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <motion.div
                                  animate={{ scale: [0.8, 1.2, 0.8] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    delay: 0,
                                  }}
                                  className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                                />
                                <motion.div
                                  animate={{ scale: [0.8, 1.2, 0.8] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    delay: 0.15,
                                  }}
                                  className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                                />
                                <motion.div
                                  animate={{ scale: [0.8, 1.2, 0.8] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    delay: 0.3,
                                  }}
                                  className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                                />
                              </div>
                              <motion.span
                                key={thinkingPhrase}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-[11px] text-muted-foreground/70 italic"
                              >
                                {thinkingPhrase}
                              </motion.span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    <div ref={scrollRef} />
                  </div>
                )}

              </div>

              {/* Scroll to bottom button — outside scrollable area to avoid overlapping text */}
              <AnimatePresence>
                {showScrollDown && hasMessages && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full bg-card/95 backdrop-blur-sm border border-border/60 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowDown size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Inline Suggestion Chips ── */}
            {hasMessages && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 pb-2 shrink-0"
              >
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {QUICK_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(suggestion.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card/80 hover:bg-primary/5 hover:border-primary/30 text-[11px] text-muted-foreground hover:text-foreground whitespace-nowrap transition-all duration-200 shrink-0"
                    >
                      <suggestion.icon size={11} />
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Proactive Nudge ── */}
            <AnimatePresence>
              {nudgeMessage && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="px-4 pb-2 shrink-0"
                >
                  <div className="flex items-start gap-2 p-2.5 rounded-xl border border-primary/20 bg-primary/5">
                    <BrainCircuit size={14} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[12px] text-foreground/80 leading-relaxed">
                        {nudgeMessage}
                      </p>
                      <button
                        onClick={() => setNudgeMessage(null)}
                        className="text-[10px] text-muted-foreground hover:text-foreground mt-1 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input Area ── */}
            <div className="p-3 border-t border-border/40 bg-card/30 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-end gap-2"
              >
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
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
                    className="w-full resize-none rounded-xl border border-border/60 bg-background/80 px-4 py-2.5 pr-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200 max-h-[120px] scrollbar-hide"
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isStreaming}
                  className={cn(
                    "h-10 w-10 rounded-xl shrink-0 transition-all duration-300 shadow-sm",
                    input.trim()
                      ? "bg-primary hover:bg-primary-hover text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isStreaming ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send
                      size={16}
                      className={cn(
                        input.trim() && "-rotate-45 transition-transform"
                      )}
                    />
                  )}
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                AI Tutor can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Action Button ── */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto relative h-14 w-14 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 group",
          isOpen
            ? "bg-muted text-muted-foreground shadow-md"
            : "bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(93,134,108,0.4)]"
        )}
      >
        {!isOpen && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}

        {!isOpen && (
          <span
            className="absolute inset-0 rounded-2xl animate-ping bg-primary/20 pointer-events-none"
            style={{ animationDuration: "3s" }}
          />
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Image
                src="/edriswhitelogo.png"
                alt="AI Tutor"
                width={28}
                height={28}
                className="object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Tooltip Label (only when closed) ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="pointer-events-none absolute bottom-4 right-[72px] bg-card border border-border/60 shadow-lg rounded-lg px-3 py-1.5"
          >
            <p className="text-xs font-medium text-foreground whitespace-nowrap">
              Ask AI Tutor
            </p>
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-card border-r border-b border-border/60 rotate-[-45deg]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div >
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
  if (!onSeekVideo) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    );
  }

  // Split content at timestamp patterns and interleave clickable buttons
  const parts = content.split(TIMESTAMP_REGEX);

  if (parts.length === 1) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    );
  }

  // The split result alternates: [text, match, text, match, ...]
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 0) {
      // Regular text segment — render as markdown
      if (part) {
        elements.push(
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {part}
          </ReactMarkdown>
        );
      }
    } else {
      // Matched timestamp — render as clickable button
      const seconds = parseTimestampToSeconds(part);
      elements.push(
        <button
          key={i}
          onClick={() => onSeekVideo(seconds)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[12px] font-medium cursor-pointer transition-colors mx-0.5"
          title={`Jump to ${part}`}
        >
          ▶ {part}
        </button>
      );
    }
  }

  return <>{elements}</>;
}
