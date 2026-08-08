"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { replyToTicket } from "@/app/data/support/reply-to-ticket";
import { toast } from "sonner";
import { Send, Lock } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to send reply"
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
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
        rows={3}
        className="resize-none"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {canAddInternalNote && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="internal-note"
                checked={isInternal}
                onCheckedChange={(checked) =>
                  setIsInternal(checked === true)
                }
                disabled={disabled || isPending}
              />
              <Label
                htmlFor="internal-note"
                className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                <Lock className="h-3 w-3" />
                Internal note (staff only)
              </Label>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={disabled || isPending || !message.trim()}
          size="sm"
        >
          <Send className="h-4 w-4 mr-1.5" />
          {isPending ? "Sending..." : isInternal ? "Add Note" : "Send Reply"}
        </Button>
      </div>
    </form>
  );
}
