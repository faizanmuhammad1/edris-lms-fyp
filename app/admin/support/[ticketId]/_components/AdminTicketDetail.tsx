"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TicketConversation } from "@/components/support/TicketConversation";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { TicketMetadataSidebar } from "@/components/support/TicketMetadataSidebar";
import { adminUpdateTicket } from "@/app/data/support/admin-update-ticket";
import { adminCloseTicket } from "@/app/data/support/admin-close-ticket";
import { resolveTicket } from "@/app/data/support/resolve-ticket";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react";
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
import {
  ticketStatusOptions,
  ticketPriorityOptions,
  ticketCategoryOptions,
} from "@/app/data/support/schemas";

interface AdminTicketDetailProps {
  ticket: any;
  currentUserId: string;
}

export function AdminTicketDetail({
  ticket,
  currentUserId,
}: AdminTicketDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [editStatus, setEditStatus] = useState(ticket.status);
  const [editPriority, setEditPriority] = useState(ticket.priority);
  const [editCategory, setEditCategory] = useState(ticket.category);

  const isClosed = ticket.status === "Closed";

  const handleUpdate = () => {
    const updates: any = {};
    if (editStatus !== ticket.status) updates.status = editStatus;
    if (editPriority !== ticket.priority) updates.priority = editPriority;
    if (editCategory !== ticket.category) updates.category = editCategory;

    if (Object.keys(updates).length === 0) {
      toast.info("No changes to save");
      return;
    }

    startTransition(async () => {
      try {
        await adminUpdateTicket(ticket.id, updates);
        toast.success("Ticket updated");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update ticket"
        );
      }
    });
  };

  const handleResolve = () => {
    startTransition(async () => {
      try {
        await resolveTicket(ticket.id);
        toast.success("Ticket resolved");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to resolve"
        );
      }
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      try {
        await adminCloseTicket(ticket.id);
        toast.success("Ticket closed");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to close ticket"
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/admin/support"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Support Center
        </Link>

        <div className="flex items-center gap-2">
          {!isClosed && ticket.status !== "Resolved" && (
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

          {!isClosed && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Close Ticket
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close Ticket</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently close the ticket. No further replies can be
                    added. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClose}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Close Ticket
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
                <CardTitle className="text-sm font-medium">Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <TicketReplyForm
                  ticketId={ticket.id}
                  canAddInternalNote={true}
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
        <div className="space-y-4">
          <TicketMetadataSidebar ticket={ticket} />

          {/* Admin Controls */}
          {!isClosed && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Admin Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Priority</Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketPriorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketCategoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button
                  onClick={handleUpdate}
                  disabled={isPending}
                  size="sm"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
