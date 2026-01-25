"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "bot";
    content: string;
    timestamp: Date;
}

export function LessonChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "bot",
            content: "Hello! I'm your AI learning assistant. Ask me anything about this lesson!",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Mock response simulation
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: "That's a great question! I'm analyzing the lesson content... (This is a demo response)",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="pointer-events-auto mb-4 w-[380px] h-[500px] bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">AI Tutor</h3>
                                    <div className="flex items-center gap-1.5 opacity-80">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                                        </span>
                                        <span className="text-xs">Online</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                                onClick={() => setIsOpen(false)}
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-background/50">
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-3 max-w-[85%]",
                                            msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm",
                                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
                                        )}>
                                            {msg.role === "user" ? "You" : <Bot size={14} />}
                                        </div>

                                        <div className={cn(
                                            "p-3 rounded-2xl text-sm shadow-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-white dark:bg-muted text-foreground rounded-tl-none border"
                                        )}>
                                            {msg.content}
                                            <p className={cn("text-[10px] mt-1 opacity-50", msg.role === "user" ? "text-right" : "text-left")}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex gap-3 max-w-[85%] mr-auto"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Bot size={14} />
                                        </div>
                                        <div className="bg-white dark:bg-muted p-4 rounded-2xl rounded-tl-none border shadow-sm flex gap-1">
                                            <motion.span
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                                                className="w-2 h-2 bg-current rounded-full"
                                            />
                                            <motion.span
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                                                className="w-2 h-2 bg-current rounded-full"
                                            />
                                            <motion.span
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                                                className="w-2 h-2 bg-current rounded-full"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-background border-t shrink-0">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="relative"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="pr-12 py-6 rounded-full border-muted-foreground/20 focus-visible:ring-violet-500 bg-muted/30 shadow-inner"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className={cn(
                                        "absolute right-1 top-1 h-10 w-10 rounded-full transition-all duration-300",
                                        input.trim()
                                            ? "bg-violet-600 hover:bg-violet-700 shadow-lg scale-100"
                                            : "bg-muted text-muted-foreground shadow-none scale-90"
                                    )}
                                    disabled={!input.trim()}
                                >
                                    <Send size={18} />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center justify-center relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-white/20 group-hover:scale-150 transition-transform duration-500 rounded-full opacity-0 group-hover:opacity-100" />
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={28} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <Sparkles size={28} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
