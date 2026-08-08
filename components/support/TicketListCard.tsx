"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketCategoryBadge } from "./TicketCategoryBadge";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

interface TicketListCardProps {
  ticket: {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    assignedTo: {
      id: string;
      name: string;
      image: string | null;
      role: string | null;
    } | null;
    createdBy?: {
      id: string;
      name: string;
      image: string | null;
      role: string | null;
    } | null;
    course: {
      id: string;
      title: string;
      slug: string;
    } | null;
    _count: {
      messages: number;
    };
  };
  href: string;
  showCreatedBy?: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TicketListCard({
  ticket,
  href,
  showCreatedBy = false,
}: TicketListCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/30 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">
                  {ticket.ticketNumber}
                </span>
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
              </div>

              {/* Subject */}
              <h3 className="font-medium text-sm truncate">{ticket.subject}</h3>

              {/* Meta row */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <TicketCategoryBadge category={ticket.category} />

                {ticket.course && (
                  <span className="truncate max-w-[200px]">
                    {ticket.course.title}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {ticket._count.messages}
                </span>

                <span>
                  Updated{" "}
                  {formatDistanceToNow(new Date(ticket.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {/* Right side: assignee or creator */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              {showCreatedBy && ticket.createdBy ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">by</span>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={ticket.createdBy.image || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(ticket.createdBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground max-w-[80px] truncate">
                    {ticket.createdBy.name}
                  </span>
                </div>
              ) : ticket.assignedTo ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={ticket.assignedTo.image || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(ticket.assignedTo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground max-w-[80px] truncate">
                    {ticket.assignedTo.name}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Unassigned
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
