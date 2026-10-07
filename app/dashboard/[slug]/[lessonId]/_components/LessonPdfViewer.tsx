"use client";

import { useState, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, Loader2, Download, Eye, EyeOff, RefreshCw } from "lucide-react";

interface LessonPdfViewerProps {
  lessonId: string;
  fileKey: string;
  fileName?: string | null;
}

type Action = "preview" | "open" | "download";

async function requestSignedUrl(lessonId: string, fileKey: string, disposition: "inline" | "attachment") {
  const res = await fetch("/api/lesson-files/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, fileKey, disposition }),
  });
  if (!res.ok) throw new Error("signed-url");
  const data = await res.json();
  return data.url as string;
}

export function LessonPdfViewer({ lessonId, fileKey, fileName }: LessonPdfViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<{ message: string; retry: Action } | null>(null);
  const headingId = useId();

  const displayName = fileName ?? fileKey.split("/").pop() ?? "Lesson PDF";

  const run = useCallback(
    async (action: Action) => {
      if (busy) return;
      setError(null);

      // Open the tab synchronously (inside the tap) so mobile browsers don't block it as a pop-up.
      const newTab = action === "open" ? window.open("", "_blank") : null;
      if (newTab) newTab.opener = null;

      setBusy(action);
      try {
        if (action === "download") {
          const url = await requestSignedUrl(lessonId, fileKey, "attachment");
          window.location.assign(url);
          return;
        }
        // Signed links expire, so only the inline preview reuses a previously fetched one.
        const url =
          action === "preview" && previewUrl ? previewUrl : await requestSignedUrl(lessonId, fileKey, "inline");
        if (action === "open") {
          if (newTab) newTab.location.href = url;
          else window.location.assign(url);
        } else {
          setPreviewUrl(url);
          setShowPreview(true);
        }
      } catch {
        newTab?.close();
        setError({
          message:
            action === "download"
              ? "We couldn't download the PDF. Please try again."
              : "We couldn't load the PDF. Please try again.",
          retry: action,
        });
      } finally {
        setBusy(null);
      }
    },
    [busy, lessonId, fileKey, previewUrl]
  );

  return (
    <Card role="region" aria-labelledby={headingId}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5 text-primary" aria-hidden="true" />
          <h2 id={headingId} className="text-lg font-semibold">
            Lesson PDF
          </h2>
        </CardTitle>
        <CardDescription className="break-all">{displayName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {/* Inline previews are unreliable on phones (iOS shows only the first page), so they're desktop-first. */}
          <Button
            variant="outline"
            size="lg"
            className="hidden md:inline-flex"
            disabled={!!busy}
            onClick={() => (showPreview ? setShowPreview(false) : run("preview"))}
            aria-expanded={showPreview}
          >
            {busy === "preview" ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : showPreview ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
          <Button variant="outline" size="lg" disabled={!!busy} onClick={() => run("open")}>
            {busy === "open" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ExternalLink aria-hidden="true" />}
            Open in new tab
          </Button>
          <Button variant="outline" size="lg" disabled={!!busy} onClick={() => run("download")}>
            {busy === "download" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
            Download
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => run(error.retry)}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          </div>
        )}

        {showPreview && previewUrl && (
          <div className="hidden overflow-hidden rounded-lg border bg-muted/30 md:block">
            <iframe title={`Preview of ${displayName}`} src={previewUrl} className="h-[75vh] min-h-[480px] w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
