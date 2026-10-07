"use client";

import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
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

interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (delete, ban, remove...). */
  destructive?: boolean;
  /**
   * Runs on confirm. The dialog stays open with a spinner until it resolves;
   * return false to keep it open (e.g. when the action reported an error).
   */
  onConfirm: () => Promise<boolean | void> | boolean | void;
  /** Element that opens the dialog (uncontrolled mode). */
  trigger?: ReactNode;
  /** Controlled mode. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Standard confirmation for destructive or irreversible actions. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isOpen = open ?? internalOpen;

  const setOpen = (next: boolean) => {
    if (pending) return;
    onOpenChange?.(next);
    if (open === undefined) setInternalOpen(next);
  };

  async function handleConfirm() {
    setPending(true);
    try {
      const result = await onConfirm();
      if (result !== false) {
        onOpenChange?.(false);
        if (open === undefined) setInternalOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild={typeof description !== "string"}>
            {typeof description === "string" ? description : <div>{description}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending}
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
