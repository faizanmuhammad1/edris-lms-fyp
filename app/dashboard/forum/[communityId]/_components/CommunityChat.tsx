"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconSend, IconPaperclip } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface CommunityChatProps {
  communityId: string;
}

export function CommunityChat({ }: CommunityChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      author: "John Doe",
      authorInitials: "JD",
      content: "What are the best practices for React component architecture in large applications?",
      timestamp: "2 hours ago",
      isCurrentUser: false,
    },
    {
      id: "2",
      author: "You",
      authorInitials: "ME",
      content: "I think using a combination of composition patterns and custom hooks works best for scalability.",
      timestamp: "1 hour ago",
      isCurrentUser: true,
    },
    {
      id: "3",
      author: "Jane Smith",
      authorInitials: "JS",
      content: "I've been exploring Next.js 15 and the new features are amazing! Has anyone tried the new caching strategies?",
      timestamp: "5 hours ago",
      isCurrentUser: false,
    },
    {
      id: "4",
      author: "Bob Johnson",
      authorInitials: "BJ",
      content: "Looking for recommendations on state management libraries. Redux vs Zustand vs Jotai?",
      timestamp: "1 day ago",
      isCurrentUser: false,
    },
    {
      id: "5",
      author: "You",
      authorInitials: "ME",
      content: "I've been using Zustand recently and it's been great for smaller projects. Redux is still better for complex apps though.",
      timestamp: "30 minutes ago",
      isCurrentUser: true,
    },
    {
      id: "6",
      author: "Alice Williams",
      authorInitials: "AW",
      content: "Agreed! Zustand is much simpler and the bundle size is smaller. Perfect for most use cases.",
      timestamp: "15 minutes ago",
      isCurrentUser: false,
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const messageContent = inputValue.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      author: "You",
      authorInitials: "ME",
      content: messageContent,
      timestamp: "just now",
      isCurrentUser: true,
    };

    setIsSending(true);
    setInputValue("");
    
    // Simulate sending
    setTimeout(() => {
      setMessages((prev) => [...prev, newMessage]);
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="py-4 px-4 max-w-4xl mx-auto">
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1]?.author !== message.author;
            const isSameAuthor = index > 0 && messages[index - 1]?.author === message.author;
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 py-1.5 px-2 -mx-2 rounded-md transition-colors group",
                  message.isCurrentUser ? "flex-row-reverse" : "flex-row",
                  !isSameAuthor && "mt-2"
                )}
              >
                {showAvatar ? (
                  <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm">
                    <AvatarFallback
                      className={cn(
                        "text-sm font-bold",
                        message.isCurrentUser
                          ? "bg-primary text-white"
                          : "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white"
                      )}
                    >
                      {message.authorInitials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 shrink-0" />
                )}
                <div
                  className={cn(
                    "flex flex-col gap-1 max-w-[70%]",
                    message.isCurrentUser ? "items-end" : "items-start"
                  )}
                >
                  {showAvatar && (
                    <div className={cn(
                      "flex items-center gap-2 mb-0.5 px-1",
                      message.isCurrentUser && "flex-row-reverse"
                    )}>
                      <span className="text-sm font-semibold text-foreground">
                        {message.author}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-[15px] leading-normal break-words",
                      message.isCurrentUser
                        ? "bg-primary text-primary-foreground shadow-sm rounded-tr-md"
                        : "bg-card border border-border shadow-sm rounded-tl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-11 w-11 rounded-full"
              >
                <IconPaperclip className="h-5 w-5" />
              </Button>
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="min-h-[44px] max-h-[120px] resize-none rounded-2xl border bg-background px-4 py-2.5 pr-16 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  disabled={isSending}
                  rows={1}
                />
                <div className="absolute right-3 bottom-2.5">
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    ↵
                  </kbd>
                </div>
              </div>
              <Button
                type="submit"
                size="icon"
                className="shrink-0 h-11 w-11 rounded-full disabled:opacity-50"
                disabled={!inputValue.trim() || isSending}
              >
                {isSending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IconSend className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

