"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, Loader2 } from "lucide-react";

interface LessonPdfViewerProps {
  lessonId: string;
  fileKey: string;
  fileName?: string | null;
}

export function LessonPdfViewer({ lessonId, fileKey, fileName }: LessonPdfViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUrl = useCallback(async (disposition: "inline" | "attachment" = "inline") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, fileKey, disposition }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load PDF");
      }
      const data = await res.json();
      if (disposition === "inline") {
        setUrl(data.url);
      } else {
        window.open(data.url, "_blank", "noopener");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [lessonId, fileKey]);

  const displayName = fileName ?? fileKey.split("/").pop() ?? "Lesson PDF";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Lesson PDF
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => fetchUrl("inline")}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "View"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => fetchUrl("attachment")}
            >
              <ExternalLink className="size-4 mr-1" /> Open / Download
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{displayName}</p>
      </CardHeader>
      {error && (
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      )}
      {url && !error && (
        <CardContent className="pt-0">
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            <iframe
              title={displayName}
              src={url}
              className="w-full aspect-[4/3] min-h-[400px]"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
