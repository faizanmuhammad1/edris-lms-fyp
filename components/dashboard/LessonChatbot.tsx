"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

const QUICK_SUGGESTIONS = [
  { icon: Lightbulb, text: "Explain this concept simply" },
  { icon: BookOpen, text: "Summarize the key points" },
  { icon: BrainCircuit, text: "Give me a practice question" },
  { icon: MessageCircle, text: "What should I focus on?" },
];

export function LessonChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

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

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Simulated AI response
    setTimeout(() => {
      const responses = [
        "Great question! Let me break that down for you.\n\nThe key concept here is about understanding the fundamentals. Think of it like building blocks — each piece connects to form a bigger picture.\n\nWould you like me to elaborate on any specific part?",
        "That's an excellent point to explore! Based on the lesson content, here are the main takeaways:\n\n1. **Core Principle** — Understanding the foundation is crucial\n2. **Application** — How this applies in real scenarios\n3. **Practice** — Repetition builds mastery\n\nShall I go deeper into any of these?",
        "I'm glad you asked! This is one of the most important concepts in this module.\n\nThe simple way to think about it: imagine you're explaining it to a friend over coffee. The essence is about connecting theory with practice.\n\nDo you want me to create a quick quiz to test your understanding?",
      ];

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1800);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={cn(
              "pointer-events-auto mb-4 bg-background/95 backdrop-blur-2xl border border-border/60 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] rounded-2xl flex flex-col overflow-hidden transition-all duration-300",
              isExpanded
                ? "w-[520px] h-[680px]"
                : "w-[400px] h-[560px]"
            )}
          >
            {/* ── Header ── */}
            <div className="relative shrink-0 overflow-hidden">
              {/* Background gradient layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                  backgroundSize: '40px 40px',
                }}
              />

              <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* AI Avatar */}
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/10">
                      <BrainCircuit size={20} className="text-white" />
                    </div>
                    {/* Online pulse */}
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
                      Ask anything about this lesson
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg h-8 w-8"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
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
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto relative"
            >
              {!hasMessages ? (
                /* ── Empty / Welcome State ── */
                <div className="h-full flex flex-col items-center justify-center px-6 py-8">
                  {/* Decorative icon */}
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
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
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
                    <h4 className="text-lg font-semibold text-foreground mb-1.5">
                      Hi there! I&apos;m your AI Tutor
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                      I can help you understand the lesson better. Try asking a question or pick a suggestion below.
                    </p>
                  </motion.div>

                  {/* Quick Suggestions Grid */}
                  <div className="w-full grid grid-cols-2 gap-2 px-1">
                    {QUICK_SUGGESTIONS.map((suggestion, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        onClick={() => handleSend(suggestion.text)}
                        className="group flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-primary/5 hover:border-primary/30 text-left transition-all duration-200 cursor-pointer"
                      >
                        <div className="h-7 w-7 rounded-lg bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors">
                          <suggestion.icon size={14} className="text-primary" />
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
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx === messages.length - 1 ? 0.05 : 0 }}
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
                        {msg.role === "user" ? (
                          "You"
                        ) : (
                          <Bot size={16} />
                        )}
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
                            "px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md shadow-sm"
                              : "bg-card border border-border/60 text-foreground rounded-2xl rounded-tl-md shadow-xs"
                          )}
                        >
                          {msg.content}
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
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5"
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
                        <Bot size={16} />
                      </div>
                      <div className="bg-card border border-border/60 px-4 py-3 rounded-2xl rounded-tl-md shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <motion.div
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                            className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.15 }}
                            className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
                            className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={scrollRef} />
                </div>
              )}

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollDown && hasMessages && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-card border border-border/60 shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowDown size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Inline Suggestion Chips (shown after messages exist) ── */}
            {hasMessages && !isTyping && (
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
                    placeholder="Ask your AI tutor..."
                    rows={1}
                    className="w-full resize-none rounded-xl border border-border/60 bg-background/80 px-4 py-2.5 pr-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200 max-h-[120px] scrollbar-hide"
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    "h-10 w-10 rounded-xl shrink-0 transition-all duration-300 shadow-sm",
                    input.trim()
                      ? "bg-primary hover:bg-primary-hover text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Send size={16} className={cn(input.trim() && "-rotate-45 transition-transform")} />
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
        {/* Shine effect on hover */}
        {!isOpen && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-primary/20 pointer-events-none" style={{ animationDuration: '3s' }} />
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
              <Sparkles size={24} />
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
            {/* Arrow */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-card border-r border-b border-border/60 rotate-[-45deg]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
