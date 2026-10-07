"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { RotateCcw, CheckCircle2, ArrowUpRight, Loader2, Lock } from "lucide-react";
import type { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { reopenTicket } from "@/app/data/support/reopen-ticket";
import { resolveTicket } from "@/app/data/support/resolve-ticket";
import { escalateTicket } from "@/app/data/support/escalate-ticket";
import { PageHeader } from "@/components/general/PageHeader";
import { TicketConversation } from "@/components/support/TicketConversation";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { TicketMetadataSidebar } from "@/components/support/TicketMetadataSidebar";
import { TicketStatusBadge } from "@/components/support/TicketStatusBadge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Ticket = NonNullable<Awaited<ReturnType<typeof getTicketDetails>>>;

interface TicketDetailViewProps {
  ticket: Ticket;
  currentUserId: string;
  backHref: string;
}

type PendingAction = "reopen" | "resolve" | "escalate" | null;

export function TicketDetailView({ ticket, currentUserId, backHref }: TicketDetailViewProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [escalateNote, setEscalateNote] = useState("");
  const [escalateOpen, setEscalateOpen] = useState(false);
  const noteId = useId();

  const isClosed = ticket.status === "Closed";
  const isResolved = ticket.status === "Resolved";

  // Server actions hide error details in production, so messages here are fixed and friendly.
  const run = (action: Exclude<PendingAction, null>, fn: () => Promise<unknown>, success: string, failure: string) => {
    setPendingAction(action);
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
        if (action === "escalate") {
          setEscalateNote("");
          setEscalateOpen(false);
        }
      } catch {
        toast.error(failure);
      } finally {
        setPendingAction(null);
      }
    });
  };

  const spinner = (action: PendingAction) =>
    isPending && pendingAction === action ? <Loader2 className="animate-spin" aria-hidden="true" /> : null;

  const actions = (
    <>
      {ticket.canReopen && (
        <Button
          variant="outline"
          size="lg"
          onClick={() =>
            run(
              "reopen",
              () => reopenTicket(ticket.id),
              "Ticket reopened",
              "We couldn't reopen this ticket. Please try again."
            )
          }
          disabled={isPending}
        >
          {spinner("reopen") ?? <RotateCcw aria-hidden="true" />}
          Reopen ticket
        </Button>
      )}

      {ticket.canResolve && !isResolved && !isClosed && (
        <Button
          variant="outline"
          size="lg"
          onClick={() =>
            run(
              "resolve",
              () => resolveTicket(ticket.id),
              "Ticket marked as resolved",
              "We couldn't resolve this ticket. Please try again."
            )
          }
          disabled={isPending}
          className="border-green-300 text-green-800 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/20"
        >
          {spinner("resolve") ?? <CheckCircle2 aria-hidden="true" />}
          Mark resolved
        </Button>
      )}

      {ticket.canEscalate && !isResolved && !isClosed && (
        <AlertDialog open={escalateOpen} onOpenChange={(open) => !isPending && setEscalateOpen(open)}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              disabled={isPending}
              className="border-orange-300 text-orange-800 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/20"
            >
              <ArrowUpRight aria-hidden="true" />
              Escalate to admin
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Escalate to admin</AlertDialogTitle>
              <AlertDialogDescription>
                This forwards the ticket to the platform admin. You can add a note explaining why it needs admin
                attention.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor={noteId}>Note for the admin (optional)</Label>
              <Textarea
                id={noteId}
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
                rows={3}
                maxLength={1000}
                className="resize-none"
                disabled={isPending}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <Button
                onClick={() =>
                  run(
                    "escalate",
                    () => escalateTicket(ticket.id, escalateNote.trim() || undefined),
                    "Ticket escalated to admin",
                    "We couldn't escalate this ticket. Please try again."
                  )
                }
                disabled={isPending}
                aria-busy={isPending}
              >
                {spinner("escalate")}
                Escalate
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
  const hasActions = ticket.canReopen || (!isResolved && !isClosed && (ticket.canResolve || ticket.canEscalate));

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={backHref}
        backLabel="Back to tickets"
        title={<span className="break-words">{ticket.subject}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm">{ticket.ticketNumber}</span>
            <TicketStatusBadge status={ticket.status} />
          </span>
        }
        actions={hasActions ? actions : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-semibold">Conversation</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TicketConversation messages={ticket.messages} currentUserId={currentUserId} />
            </CardContent>
          </Card>

          {!isClosed ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 className="text-base font-semibold">{isResolved ? "Add a comment" : "Reply"}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TicketReplyForm ticketId={ticket.id} canAddInternalNote={ticket.canAddInternalNote} disabled={false} />
              </CardContent>
            </Card>
          ) : (
            <p className="flex items-center justify-center gap-2 rounded-lg border bg-muted/30 px-4 py-4 text-center text-sm text-muted-foreground">
              <Lock className="size-4 shrink-0" aria-hidden="true" />
              This ticket is closed. No further replies can be added.
            </p>
          )}
        </div>

        <aside aria-label="Ticket details" className="min-w-0">
          <TicketMetadataSidebar ticket={ticket} />
        </aside>
      </div>
    </div>
  );
}
