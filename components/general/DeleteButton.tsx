"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Result shapes returned by the delete actions in use ({status,message} or {success,error}). */
type DeleteActionResult = {
  status?: string;
  success?: boolean;
  message?: string;
  error?: string;
} | null | undefined | void;

interface DeleteButtonProps {
  id: string;
  deleteAction: (id: string) => Promise<DeleteActionResult>;
  variant?: "ghost" | "outline" | "destructive" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  /** What is being deleted, e.g. "post". Used in the accessible name, dialog and toasts. */
  itemLabel?: string;
  /** Name of the specific item, e.g. the post title, shown in the dialog. */
  itemName?: string;
  confirmTitle?: string;
  /** Consequence text for the confirmation dialog. */
  confirmDescription?: ReactNode;
  /** Navigate here after a successful delete (e.g. back to the list from a detail page). */
  redirectTo?: string;
}

function isSuccess(result: DeleteActionResult): boolean {
  // Actions that return nothing signal failure by throwing.
  if (!result) return true;
  return result.status === "success" || result.success === true;
}

/** Delete control with a confirmation dialog, pending state and result toast. */
export function DeleteButton({
  id,
  deleteAction,
  variant = "ghost",
  size = "icon",
  className,
  itemLabel = "item",
  itemName,
  confirmTitle,
  confirmDescription,
  redirectTo,
}: DeleteButtonProps) {
  const [isRefreshing, startTransition] = useTransition();
  const router = useRouter();
  const isIconOnly = size === "icon";
  const accessibleName = itemName ? `Delete ${itemLabel} "${itemName}"` : `Delete ${itemLabel}`;
  const capitalizedLabel = itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1);

  async function handleConfirm(): Promise<boolean> {
    try {
      const result = await deleteAction(id);
      if (!isSuccess(result)) {
        toast.error(result?.error || result?.message || `Couldn't delete the ${itemLabel}. Please try again.`);
        return false;
      }
      toast.success(result?.message || `${capitalizedLabel} deleted`);
      startTransition(() => {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      });
      return true;
    } catch {
      toast.error(`Couldn't delete the ${itemLabel}. Check your connection and try again.`);
      return false;
    }
  }

  // The button is often rendered inside a clickable card/link: keep clicks on it and on the
  // dialog (a portal, whose React events still bubble through this tree) from reaching it.
  const stopClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <span className="contents" onClick={stopClick}>
      <ConfirmDialog
        title={confirmTitle ?? `Delete this ${itemLabel}?`}
        description={
          confirmDescription ?? (
            <>
              {itemName ? (
                <>
                  <span className="font-medium text-foreground [overflow-wrap:anywhere]">
                    &ldquo;{itemName}&rdquo;
                  </span>{" "}
                  will be permanently deleted.
                </>
              ) : (
                <>This {itemLabel} will be permanently deleted.</>
              )}{" "}
              This can&apos;t be undone.
            </>
          )
        }
        confirmLabel={`Delete ${itemLabel}`}
        destructive
        onConfirm={handleConfirm}
        trigger={
          <Button
            type="button"
            variant={variant}
            size={size}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            aria-label={isIconOnly ? accessibleName : undefined}
            title={isIconOnly ? accessibleName : undefined}
            className={cn(variant === "ghost" && "text-destructive hover:text-destructive", className)}
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className={cn("size-4", variant !== "destructive" && "text-destructive")} aria-hidden="true" />
            )}
            {!isIconOnly && (
              <>
                Delete<span className="sr-only"> {itemLabel}</span>
              </>
            )}
          </Button>
        }
      />
    </span>
  );
}
