"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Loader2, Lock, Save, XCircle } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { pluralize } from "@/app/admin/_lib/format";
import { adminCloseTicket } from "@/app/data/support/admin-close-ticket";
import { adminUpdateTicket } from "@/app/data/support/admin-update-ticket";
import type { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { resolveTicket } from "@/app/data/support/resolve-ticket";
import {
  ticketCategoryOptions,
  ticketPriorityOptions,
  ticketStatusOptions,
} from "@/app/data/support/schemas";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { PageHeader } from "@/components/general/PageHeader";
import { TicketConversation } from "@/components/support/TicketConversation";
import { TicketMetadataSidebar } from "@/components/support/TicketMetadataSidebar";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { TicketStatusBadge } from "@/components/support/TicketStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TicketDetails = NonNullable<Awaited<ReturnType<typeof getTicketDetails>>>;

interface AdminTicketDetailProps {
  ticket: TicketDetails;
  currentUserId: string;
}

/**
 * Message to show for a failed ticket action. Thrown server-action errors are
 * replaced by a generic text in production, so fall back to our own wording then.
 */
function actionErrorMessage(error: unknown, fallback: string): string {
  if (
    error instanceof Error &&
    error.message &&
    !/server components render|omitted in production|digest/i.test(error.message)
  ) {
    return error.message;
  }
  return fallback;
}

export function AdminTicketDetail({ ticket, currentUserId }: AdminTicketDetailProps) {
  const [isResolving, startResolve] = useTransition();
  const isClosed = ticket.status === "Closed";
  const canResolve = !isClosed && ticket.status !== "Resolved";

  function handleResolve() {
    startResolve(async () => {
      try {
        await resolveTicket(ticket.id);
        toast.success("Ticket marked as resolved. The requester can see the update.");
      } catch (error) {
        toast.error(actionErrorMessage(error, "Couldn't resolve the ticket. Please try again."));
      }
    });
  }

  async function handleClose(): Promise<boolean> {
    try {
      await adminCloseTicket(ticket.id);
      toast.success("Ticket closed.");
      return true;
    } catch (error) {
      toast.error(actionErrorMessage(error, "Couldn't close the ticket. Please try again."));
      return false;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="[overflow-wrap:anywhere]">{ticket.subject}</span>}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-sm">{ticket.ticketNumber}</span>
            <TicketStatusBadge status={ticket.status} />
            <span>
              Opened by {ticket.createdBy.name}{" "}
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
          </span>
        }
        backHref="/admin/support"
        backLabel="Back to support center"
        actions={
          !isClosed && (
            <>
              {canResolve && (
                <Button variant="outline" onClick={handleResolve} disabled={isResolving} aria-busy={isResolving}>
                  {isResolving ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  )}
                  {isResolving ? "Resolving…" : "Mark resolved"}
                </Button>
              )}
              <ConfirmDialog
                title="Close this ticket?"
                description={
                  <div className="space-y-2">
                    <p>
                      The status changes to Closed and a message saying an admin closed the ticket is added to
                      the conversation.
                    </p>
                    <p>No further replies can be added unless the requester reopens it.</p>
                  </div>
                }
                confirmLabel="Close ticket"
                destructive
                onConfirm={handleClose}
                trigger={
                  <Button variant="outline" disabled={isResolving} className="text-destructive hover:text-destructive">
                    <XCircle className="size-4" aria-hidden="true" />
                    Close ticket
                  </Button>
                }
              />
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Card className="gap-4 shadow-xs">
            <section aria-labelledby="conversation-heading" className="flex flex-col gap-4">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id="conversation-heading" className="text-base font-semibold leading-tight">
                    Conversation
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {pluralize(ticket.messages.length, "message")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <TicketConversation messages={ticket.messages} currentUserId={currentUserId} />
              </CardContent>
            </section>
          </Card>

          {isClosed ? (
            <p className="flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              This ticket is closed, so no further replies can be added. The requester can reopen it if they
              still need help.
            </p>
          ) : (
            <Card className="gap-4 shadow-xs">
              <section aria-labelledby="reply-heading" className="flex flex-col gap-4">
                <CardHeader className="px-4 sm:px-6">
                  <h2 id="reply-heading" className="text-base font-semibold leading-tight">
                    Reply
                  </h2>
                  <CardDescription>
                    Replies are visible to the requester. Tick &ldquo;Internal note&rdquo; to leave a note only
                    staff can see.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <TicketReplyForm ticketId={ticket.id} canAddInternalNote />
                </CardContent>
              </section>
            </Card>
          )}
        </div>

        <aside aria-label="Ticket details and controls" className="min-w-0 space-y-6">
          <TicketMetadataSidebar ticket={ticket} />
          {!isClosed && (
            // Remount when the saved values change so the selects reflect the latest ticket.
            <TicketAdminControls
              key={`${ticket.status}|${ticket.priority}|${ticket.category}`}
              ticketId={ticket.id}
              status={ticket.status}
              priority={ticket.priority}
              category={ticket.category}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

interface TicketAdminControlsProps {
  ticketId: string;
  status: string;
  priority: string;
  category: string;
}

function TicketAdminControls({ ticketId, status, priority, category }: TicketAdminControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [editStatus, setEditStatus] = useState(status);
  const [editPriority, setEditPriority] = useState(priority);
  const [editCategory, setEditCategory] = useState(category);

  const updates: { status?: string; priority?: string; category?: string } = {};
  if (editStatus !== status) updates.status = editStatus;
  if (editPriority !== priority) updates.priority = editPriority;
  if (editCategory !== category) updates.category = editCategory;
  const isDirty = Object.keys(updates).length > 0;

  function reset() {
    setEditStatus(status);
    setEditPriority(priority);
    setEditCategory(category);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isDirty) return;
    startTransition(async () => {
      try {
        await adminUpdateTicket(ticketId, updates);
        toast.success("Ticket updated.");
      } catch (error) {
        toast.error(actionErrorMessage(error, "Couldn't update the ticket. Please try again."));
      }
    });
  }

  const fields: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: readonly { value: string; label: string }[];
    help?: string;
  }[] = [
    {
      id: "ticket-status",
      label: "Status",
      value: editStatus,
      onChange: setEditStatus,
      options: ticketStatusOptions,
      help: "Setting Closed here adds an internal note only; use “Close ticket” to tell the requester.",
    },
    {
      id: "ticket-priority",
      label: "Priority",
      value: editPriority,
      onChange: setEditPriority,
      options: ticketPriorityOptions,
      help: undefined,
    },
    {
      id: "ticket-category",
      label: "Category",
      value: editCategory,
      onChange: setEditCategory,
      options: ticketCategoryOptions,
      help: undefined,
    },
  ];

  return (
    <Card className="gap-4 shadow-xs">
      <section aria-labelledby="ticket-controls-heading" className="flex flex-col gap-4">
        <CardHeader className="px-4 sm:px-6">
          <h2 id="ticket-controls-heading" className="text-base font-semibold leading-tight">
            Update ticket
          </h2>
          <CardDescription>Changes are logged as an internal note on the conversation.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="space-y-4" disabled={isPending}>
              <legend className="sr-only">Ticket status, priority and category</legend>
              {fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <SelectTrigger
                      id={field.id}
                      className="w-full"
                      aria-describedby={field.help ? `${field.id}-help` : undefined}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.help && (
                    <p id={`${field.id}-help`} className="text-xs text-muted-foreground">
                      {field.help}
                    </p>
                  )}
                </div>
              ))}
            </fieldset>
            <div className="flex flex-col gap-2 border-t pt-4">
              <Button type="submit" disabled={!isDirty || isPending} aria-busy={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {isPending ? "Saving…" : "Save changes"}
              </Button>
              {isDirty && (
                <Button type="button" variant="ghost" onClick={reset} disabled={isPending}>
                  Discard changes
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </section>
    </Card>
  );
}
