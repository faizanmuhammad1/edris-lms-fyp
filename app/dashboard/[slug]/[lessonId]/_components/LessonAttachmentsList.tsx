"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";

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

export function LessonAttachmentsList({ lessonId, attachments }: LessonAttachmentsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDownload(att: Attachment) {
    setLoadingId(att.id);
    try {
      const res = await fetch("/api/lesson-files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, fileKey: att.fileKey, disposition: "attachment" }),
      });
      if (!res.ok) throw new Error("Failed to get download link");
      const { url } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = att.fileName;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    } catch {
      // ignore
    } finally {
      setLoadingId(null);
    }
  }

  if (attachments.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          Resources
        </CardTitle>
        <p className="text-sm text-muted-foreground">Download lesson attachments</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate min-w-0">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{att.fileName}</span>
                <span className="text-muted-foreground shrink-0">
                  ({(att.fileSize / 1024).toFixed(1)} KB)
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={loadingId === att.id}
                onClick={() => handleDownload(att)}
              >
                {loadingId === att.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
