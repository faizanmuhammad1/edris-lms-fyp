"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Lock } from "lucide-react";

interface MessageSender {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
  teacherStatus?: string | null;
}

interface Message {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
  sender: MessageSender;
}

function getRoleBadge(sender: MessageSender) {
  if (sender.role === "admin") {
    return (
      <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-primary">
        Admin
      </Badge>
    );
  }
  if (sender.role === "teacher" || sender.teacherStatus === "Approved") {
    return (
      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-blue-500 text-blue-600 dark:text-blue-400">
        Teacher
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
      Student
    </Badge>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TicketConversation({
  messages,
  currentUserId,
}: {
  messages: Message[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No messages yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4" aria-label="Messages">
      {messages.map((msg) => {
        const isOwn = msg.sender.id === currentUserId;

        return (
          <li
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.isInternal && "opacity-90"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 mt-0.5">
              <AvatarImage src={msg.sender.image || undefined} alt="" />
              <AvatarFallback className="text-xs" aria-hidden="true">
                {getInitials(msg.sender.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm break-words">
                  {msg.sender.name}
                  {isOwn && (
                    <span className="text-muted-foreground font-normal"> (You)</span>
                  )}
                </span>
                {getRoleBadge(msg.sender)}
                {msg.isInternal && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 border-amber-500 text-amber-800 dark:text-amber-400 gap-0.5"
                  >
                    <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                    Internal Note
                  </Badge>
                )}
                <time
                  dateTime={new Date(msg.createdAt).toISOString()}
                  className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto"
                >
                  {format(new Date(msg.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </time>
              </div>

              <div
                className={cn(
                  "mt-1.5 rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.isInternal
                    ? "bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-300 dark:border-amber-800"
                    : isOwn
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-muted/50 border border-border"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
