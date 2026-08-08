"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DataExportCard() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error("You are not authorized to export data.");
          return;
        }
        throw new Error("Export failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? "platform-export.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } catch {
      toast.error("Failed to download export.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Backup and export options</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Export Data</p>
            <p className="text-sm text-muted-foreground">
              Download all platform data as CSV
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={loading}>
            {loading ? "Exporting..." : "Export"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
