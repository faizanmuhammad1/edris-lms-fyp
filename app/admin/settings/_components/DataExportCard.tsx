"use client";

import { AlertCircle, Database, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./SettingsCard";

const EXPORT_DESCRIPTION_ID = "data-export-description";

function errorForStatus(status: number): string {
  if (status === 401) return "Your session has expired. Sign in again to export data.";
  if (status === 403) return "You are not authorized to export platform data.";
  return "The export couldn't be generated. Please try again.";
}

export function DataExportCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/export", { cache: "no-store" });
      if (!res.ok) {
        const message = errorForStatus(res.status);
        setError(message);
        toast.error(message);
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? "platform-export.csv";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a moment to start the download before releasing the blob.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Export downloaded as ${filename}.`);
    } catch {
      const message = "Couldn't download the export. Check your connection and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsCard
      id="data-export"
      title="Data export"
      icon={Database}
      description="Download a backup of platform records for reporting or archiving."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">Platform data (CSV)</p>
            <p id={EXPORT_DESCRIPTION_ID} className="text-sm text-muted-foreground">
              Users, courses and enrollments in one CSV file. It contains names and email addresses, so
              store it securely.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading}
            aria-busy={loading}
            aria-describedby={EXPORT_DESCRIPTION_ID}
            className="w-full sm:w-auto sm:shrink-0"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            {loading ? "Preparing export…" : "Download CSV export"}
          </Button>
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </SettingsCard>
  );
}
