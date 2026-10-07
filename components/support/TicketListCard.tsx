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
  /** Heading level for the subject; use "h2" when the list sits directly under the page h1. */
  headingLevel?: "h2" | "h3";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TicketListCard({ ticket, href, showCreatedBy = false, headingLevel = "h3" }: TicketListCardProps) {
  const Heading = headingLevel;
  const person = showCreatedBy && ticket.createdBy ? ticket.createdBy : ticket.assignedTo;

  return (
    <Link
      href={href}
      className="block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card className="cursor-pointer gap-0 border-l-4 border-l-transparent py-0 transition-colors hover:border-l-primary hover:bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1.5">
              {/* Header row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
              </div>

              {/* Subject */}
              <Heading className="line-clamp-2 text-sm font-medium break-words" title={ticket.subject}>
                {ticket.subject}
              </Heading>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <TicketCategoryBadge category={ticket.category} />

                {ticket.course && (
                  <span className="max-w-[200px] truncate" title={ticket.course.title}>
                    {ticket.course.title}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3" aria-hidden="true" />
                  {ticket._count.messages}
                  <span className="sr-only"> {ticket._count.messages === 1 ? "message" : "messages"}</span>
                </span>

                <span>
                  Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Assignee or creator */}
            <div className="flex shrink-0 items-center gap-1.5 sm:flex-col sm:items-end">
              {person ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {showCreatedBy && ticket.createdBy ? "by" : <span className="sm:sr-only">Assigned to</span>}
                  </span>
                  <Avatar className="size-5">
                    <AvatarImage src={person.image || undefined} alt="" />
                    <AvatarFallback className="text-[8px]" aria-hidden="true">
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate text-xs text-muted-foreground">{person.name}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Unassigned</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
