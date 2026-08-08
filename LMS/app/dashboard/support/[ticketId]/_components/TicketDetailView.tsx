"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketConversation } from "@/components/support/TicketConversation";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { TicketMetadataSidebar } from "@/components/support/TicketMetadataSidebar";
import { reopenTicket } from "@/app/data/support/reopen-ticket";
import { resolveTicket } from "@/app/data/support/resolve-ticket";
import { escalateTicket } from "@/app/data/support/escalate-ticket";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, CheckCircle2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
// import { getTicketDetails } from "@/app/data/support/get-ticket-details";

// type Ticket = NonNullable<Awaited<ReturnType<typeof getTicketDetails>>>;

interface TicketDetailViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ticket: any;
  currentUserId: string;
  backHref: string;
}

export function TicketDetailView({
  ticket,
  currentUserId,
  backHref,
}: TicketDetailViewProps) {
  const [isPending, startTransition] = useTransition();
  const [escalateNote, setEscalateNote] = useState("");

  const isClosed = ticket.status === "Closed";
  const isResolved = ticket.status === "Resolved";

  const handleReopen = () => {
    startTransition(async () => {
      try {
        await reopenTicket(ticket.id);
        toast.success("Ticket reopened");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to reopen ticket"
        );
      }
    });
  };

  const handleResolve = () => {
    startTransition(async () => {
      try {
        await resolveTicket(ticket.id);
        toast.success("Ticket marked as resolved");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to resolve ticket"
        );
      }
    });
  };

  const handleEscalate = () => {
    startTransition(async () => {
      try {
        await escalateTicket(ticket.id, escalateNote || undefined);
        setEscalateNote("");
        toast.success("Ticket escalated to admin");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to escalate ticket"
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back link + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to tickets
        </Link>

        <div className="flex items-center gap-2">
          {/* Student reopen */}
          {ticket.canReopen && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReopen}
              disabled={isPending}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reopen
            </Button>
          )}

          {/* Teacher/Admin resolve */}
          {ticket.canResolve && !isResolved && !isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              disabled={isPending}
              className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/20"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Resolve
            </Button>
          )}

          {/* Teacher escalate */}
          {ticket.canEscalate && !isResolved && !isClosed && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className="text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/20"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1.5" />
                  Escalate to Admin
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Escalate to Admin</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will forward the ticket to the platform admin. You can add an
                    optional note explaining why this needs admin attention.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Optional: Add a note for the admin..."
                  value={escalateNote}
                  onChange={(e) => setEscalateNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEscalate}>
                    Escalate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ticket.ticketNumber}
        </p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketConversation
                messages={ticket.messages}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>

          {/* Reply form */}
          {!isClosed && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {isResolved ? "Add a comment" : "Reply"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TicketReplyForm
                  ticketId={ticket.id}
                  canAddInternalNote={ticket.canAddInternalNote}
                  disabled={false}
                />
              </CardContent>
            </Card>
          )}

          {isClosed && (
            <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg bg-muted/30">
              This ticket is closed. No further replies can be added.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <TicketMetadataSidebar ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
