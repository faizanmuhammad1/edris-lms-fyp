"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2 } from "lucide-react";
import { GradeSubmissionDialog } from "./GradeSubmissionDialog";
import { formatDistanceToNow } from "date-fns";

interface Submission {
  id: string;
  userId: string;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  textAnswer: string | null;
  submittedAt: Date;
  status: string;
  score: number | null;
  feedback: string | null;
  gradedAt: Date | null;
  User: { name: string | null; email: string | null };
}

interface SubmissionsListProps {
  assignmentId: string;
  maxScore: number | null;
  submissions: Submission[];
}

export function SubmissionsList({
  assignmentId,
  maxScore,
  submissions,
}: SubmissionsListProps) {
  const [gradingId, setGradingId] = useState<string | null>(null);

  async function handleDownload(submissionId: string) {
    try {
      const res = await fetch("/api/assignment-submissions/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (!res.ok) throw new Error("Failed to get link");
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions</CardTitle>
        <CardDescription>
          View and grade student submissions. Resubmission is allowed until you grade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">
                    {sub.User.name ?? sub.User.email ?? "Student"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                  </p>
                  {sub.fileName && (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => handleDownload(sub.id)}
                    >
                      <Download className="size-3 mr-1" />
                      {sub.fileName}
                    </Button>
                  )}
                  {sub.textAnswer && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {sub.textAnswer}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sub.status === "Graded" ? "default" : "secondary"}>
                    {sub.status}
                  </Badge>
                  {sub.status === "Graded" && sub.score != null && (
                    <span className="text-sm font-medium">
                      {maxScore != null ? `${sub.score} / ${maxScore}` : sub.score}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGradingId(sub.id)}
                  >
                    {sub.status === "Graded" ? "View / Edit grade" : "Grade"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {gradingId && (
        <GradeSubmissionDialog
          submissionId={gradingId}
          onClose={() => setGradingId(null)}
          maxScore={maxScore}
        />
      )}
    </Card>
  );
}
