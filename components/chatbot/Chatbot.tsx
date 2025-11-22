"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !hasShownWelcome) {
      // Show "Hi" from robot when chat opens
      setTimeout(() => {
        const hiMessage: Message = {
          id: Date.now().toString(),
          content: "Hi! 👋",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages([hiMessage]);
        setHasShownWelcome(true);
      }, 300);
    } else if (!isOpen) {
      // Reset welcome message when chat closes
      setHasShownWelcome(false);
      setMessages([]);
    }
  }, [isOpen, hasShownWelcome]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand your question. This is a simulated response. In a production environment, this would connect to your AI learning assistant API.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={cn(
            "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
            "h-14 w-14 p-0",
            "bg-primary hover:bg-primary/90",
            "transition-all duration-300 hover:scale-110",
            "border-2 border-background",
            "animate-in fade-in slide-in-from-bottom-4"
          )}
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[400px] p-0 flex flex-col"
        >
          <SheetHeader className="px-6 py-4 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-lg">AI Learning Assistant</SheetTitle>
                <SheetDescription className="text-xs">
                  Ask me anything about your courses
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Card
                  className={cn(
                    "max-w-[80%] px-4 py-2.5",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary-foreground">
                      U
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t bg-muted/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={inputValue.trim() && messages[messages.length - 1]?.role === "user"}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || (inputValue.trim() && messages[messages.length - 1]?.role === "user")}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI assistant may make mistakes. Check important info.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

