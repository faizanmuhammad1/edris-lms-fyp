"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketCategoryBadge } from "./TicketCategoryBadge";
import { format } from "date-fns";
import { Clock, User, BookOpen, Calendar, Hash } from "lucide-react";

interface TicketMetadata {
  ticketNumber: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
  escalatedToAdmin: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string | null;
  } | null;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TicketMetadataSidebar({ ticket }: { ticket: TicketMetadata }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Ticket Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Ticket Number */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" aria-hidden="true" /> Ticket
          </span>
          <span className="font-mono font-medium">{ticket.ticketNumber}</span>
        </div>

        <Separator />

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <TicketStatusBadge status={ticket.status} />
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Priority</span>
          <TicketPriorityBadge priority={ticket.priority} />
        </div>

        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Category</span>
          <TicketCategoryBadge category={ticket.category} />
        </div>

        <Separator />

        {/* Created By */}
        <div className="space-y-2">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" aria-hidden="true" /> Created By
          </span>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={ticket.createdBy.image || undefined} alt="" />
              <AvatarFallback className="text-[10px]">
                {getInitials(ticket.createdBy.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{ticket.createdBy.name}</p>
              <p className="text-xs text-muted-foreground truncate">{ticket.createdBy.email}</p>
            </div>
          </div>
        </div>

        {/* Assigned To */}
        <div className="space-y-2">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" aria-hidden="true" /> Assigned To
          </span>
          {ticket.assignedTo ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={ticket.assignedTo.image || undefined} alt="" />
                <AvatarFallback className="text-[10px]">
                  {getInitials(ticket.assignedTo.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{ticket.assignedTo.name}</p>
                <p className="text-xs text-muted-foreground truncate">{ticket.assignedTo.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground italic">Unassigned</p>
          )}
        </div>

        {/* Course */}
        {ticket.course && (
          <>
            <Separator />
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Related Course
              </span>
              <p className="font-medium text-sm break-words">{ticket.course.title}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Created
            </span>
            <span className="text-xs">
              {format(new Date(ticket.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Updated
            </span>
            <span className="text-xs">
              {format(new Date(ticket.updatedAt), "MMM d, yyyy")}
            </span>
          </div>

          {ticket.resolvedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Resolved</span>
              <span className="text-xs">
                {format(new Date(ticket.resolvedAt), "MMM d, yyyy")}
              </span>
            </div>
          )}

          {ticket.closedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Closed</span>
              <span className="text-xs">
                {format(new Date(ticket.closedAt), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>

        {ticket.escalatedToAdmin && (
          <>
            <Separator />
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md px-3 py-2 text-xs text-orange-700 dark:text-orange-400">
              This ticket has been escalated to admin
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
