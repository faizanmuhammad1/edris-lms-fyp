"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaignPreview } from "../actions";

type PreviewResult =
  | { key: string; status: "ready"; subject: string; html: string }
  | { key: string; status: "error"; message: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string;
  subject: string;
  bodyJson: string;
  /** Who will receive it, e.g. "All students". */
  audience: string;
};

/** Renders the email exactly as recipients receive it, in a sandboxed frame. */
export function CampaignPreviewDialog({ open, onOpenChange, campaignId, subject, bodyJson, audience }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<PreviewResult | null>(null);
  // The preview is loading whenever the latest result is for different content.
  const requestKey = JSON.stringify([attempt, campaignId ?? null, subject, bodyJson]);
  const state = result?.key === requestKey ? result : { status: "loading" as const };
  const loadedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!open || loadedKey.current === requestKey) return;
    let cancelled = false;
    getCampaignPreview({ campaignId, subject, bodyJson })
      .then((response) => {
        if (cancelled) return;
        loadedKey.current = response.status === "success" ? requestKey : null;
        setResult(
          response.status === "success"
            ? { key: requestKey, status: "ready", subject: response.subject, html: response.html }
            : { key: requestKey, status: "error", message: response.message }
        );
      })
      .catch(() => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          status: "error",
          message: "Couldn't load the preview. Check your connection and try again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [open, requestKey, campaignId, subject, bodyJson]);

  const shownSubject = (state.status === "ready" ? state.subject : subject).trim() || "(No subject)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-4 overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Email preview</DialogTitle>
          <DialogDescription>
            This is how recipients see the campaign. Each recipient&apos;s copy has their own unsubscribe link.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-1 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
          <dt className="text-muted-foreground">Subject</dt>
          <dd className="font-medium break-words">{shownSubject}</dd>
          <dt className="text-muted-foreground">To</dt>
          <dd className="break-words">{audience}</dd>
        </dl>

        <div className="overflow-hidden rounded-lg border bg-muted/30" aria-busy={state.status === "loading"}>
          {state.status === "loading" && (
            <div className="space-y-4 p-4" role="status">
              <span className="sr-only">Loading preview…</span>
              <Skeleton className="mx-auto h-12 w-full max-w-xl" />
              <Skeleton className="mx-auto h-4 w-full max-w-xl" />
              <Skeleton className="mx-auto h-4 w-full max-w-xl" />
              <Skeleton className="mx-auto h-4 w-2/3 max-w-xl" />
              <Skeleton className="mx-auto h-32 w-full max-w-xl" />
            </div>
          )}
          {state.status === "error" && (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center" role="alert">
              <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
              <p className="text-sm">{state.message}</p>
              <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
                <RotateCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          )}
          {state.status === "ready" && (
            <iframe
              title={`Email preview: ${shownSubject}`}
              srcDoc={state.html}
              sandbox=""
              className="block h-[60dvh] min-h-[320px] w-full bg-white"
            />
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
