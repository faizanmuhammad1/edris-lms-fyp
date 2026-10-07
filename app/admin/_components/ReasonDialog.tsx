"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_LENGTH = 500;

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  reasonLabel: string;
  reasonHint?: string;
  placeholder?: string;
  /** When true the confirm button stays disabled until a reason is typed. */
  required?: boolean;
  confirmLabel: string;
  destructive?: boolean;
  /** Return false to keep the dialog open (e.g. the action failed). */
  onConfirm: (reason: string) => Promise<boolean | void> | boolean | void;
}

/** Confirmation that also collects a short reason (ban, reject...). */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  reasonLabel,
  reasonHint,
  placeholder,
  required = false,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ReasonDialogProps) {
  const id = useId();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  // Start empty every time the dialog opens.
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const trimmed = reason.trim();
  const canConfirm = !pending && (!required || trimmed.length > 0);

  async function handleConfirm() {
    if (!canConfirm) return;
    setPending(true);
    try {
      const result = await onConfirm(trimmed);
      if (result !== false) onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild={typeof description !== "string"}>
            {typeof description === "string" ? description : <div>{description}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`${id}-reason`}>
            {reasonLabel}
            {!required && <span className="font-normal text-muted-foreground"> (optional)</span>}
          </Label>
          <Textarea
            id={`${id}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={placeholder}
            rows={3}
            required={required}
            aria-describedby={`${id}-hint`}
            disabled={pending}
          />
          <p id={`${id}-hint`} className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{reasonHint}</span>
            <span className="shrink-0 tabular-nums">
              {reason.length}/{MAX_LENGTH}
            </span>
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-busy={pending}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
