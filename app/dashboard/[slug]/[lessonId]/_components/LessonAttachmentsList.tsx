"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Paperclip } from "lucide-react";

interface Attachment {
  id: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  position: number;
}

interface LessonAttachmentsListProps {
  lessonId: string;
  attachments: Attachment[];
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function LessonAttachmentsList({ lessonId, attachments }: LessonAttachmentsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const headingId = useId();

  async function handleDownload(att: Attachment) {
    if (loadingId) return;
    setLoadingId(att.id);
    try {
      const res = await fetch("/api/lesson-files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, fileKey: att.fileKey, disposition: "attachment" }),
      });
      if (!res.ok) throw new Error("Failed to get download link");
      const { url } = await res.json();
      // Served as an attachment: downloads in place without a pop-up (works on iOS/Android too).
      window.location.assign(url);
    } catch {
      toast.error(`We couldn't download “${att.fileName}”. Please try again.`);
    } finally {
      setLoadingId(null);
    }
  }

  if (attachments.length === 0) return null;

  return (
    <Card role="region" aria-labelledby={headingId}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="size-5 text-primary" aria-hidden="true" />
          <h2 id={headingId} className="text-lg font-semibold">
            Resources
          </h2>
        </CardTitle>
        <CardDescription>Download the files for this lesson.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium" title={att.fileName}>
                  {att.fileName}
                </span>
                <span className="block text-xs text-muted-foreground">{formatBytes(att.fileSize)}</span>
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-10 shrink-0"
                disabled={loadingId === att.id}
                aria-busy={loadingId === att.id}
                onClick={() => handleDownload(att)}
                aria-label={`Download ${att.fileName}`}
              >
                {loadingId === att.id ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download aria-hidden="true" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
