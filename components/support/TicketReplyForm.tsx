"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { replyToTicket } from "@/app/data/support/reply-to-ticket";
import { toast } from "sonner";
import { Send, Lock, Loader2 } from "lucide-react";

// Mirrors replySchema (app/data/support/schemas.ts).
const MAX_LENGTH = 5000;

export function TicketReplyForm({
  ticketId,
  canAddInternalNote = false,
  disabled = false,
}: {
  ticketId: string;
  canAddInternalNote?: boolean;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const id = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    startTransition(async () => {
      try {
        await replyToTicket(ticketId, { message: message.trim(), isInternal });
        setMessage("");
        setIsInternal(false);
        toast.success(isInternal ? "Internal note added" : "Reply sent");
      } catch {
        // Server errors are not shown verbatim (production hides their details).
        toast.error("We couldn't send your reply. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Label htmlFor={`${id}-message`} className="sr-only">
        {isInternal ? "Internal note" : "Your reply"}
      </Label>
      <Textarea
        id={`${id}-message`}
        placeholder={
          disabled
            ? "This ticket is closed"
            : isInternal
              ? "Add an internal note (only visible to staff)..."
              : "Type your reply..."
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled || isPending}
        rows={4}
        maxLength={MAX_LENGTH}
        aria-describedby={`${id}-count`}
        className="resize-y"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {canAddInternalNote && (
            <div className="flex min-h-10 items-center gap-2">
              <Checkbox
                id={`${id}-internal`}
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked === true)}
                disabled={disabled || isPending}
              />
              <Label
                htmlFor={`${id}-internal`}
                className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground"
              >
                <Lock className="size-3" aria-hidden="true" />
                Internal note (staff only)
              </Label>
            </div>
          )}
          <span id={`${id}-count`} className="text-xs text-muted-foreground tabular-nums">
            {message.length}/{MAX_LENGTH}
          </span>
        </div>

        <Button type="submit" disabled={disabled || isPending || !message.trim()} aria-busy={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          {isPending ? "Sending…" : isInternal ? "Add note" : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
