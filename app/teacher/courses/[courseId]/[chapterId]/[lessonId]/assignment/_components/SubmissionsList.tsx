"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Sparkles, Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { GradeSubmissionDialog } from "./GradeSubmissionDialog";
import { formatDistanceToNow } from "date-fns";
import { gradeSubmissionWithAI } from "../actions";
import { toast } from "sonner";

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
  teacherFeedback: string | null;
  gradedAt: Date | null;
  gradingMethod: string | null;
  gradedByAiAt: Date | null;
  User: { name: string | null; email: string | null };
}

interface SubmissionsListProps {
  assignmentId: string;
  maxScore: number | null;
  autoGradeEnabled: boolean;
  submissions: Submission[];
}

export function SubmissionsList({
  maxScore,
  autoGradeEnabled,
  submissions,
}: SubmissionsListProps) {
  const router = useRouter();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [aiGradingId, setAiGradingId] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());

  const selectedSubmission = gradingId ? submissions.find((s) => s.id === gradingId) : null;

  const graded = submissions.filter((s) => s.status === "Graded");
  const autoGraded = graded.filter((s) => s.gradingMethod === "AI").length;
  const manualGraded = graded.filter((s) => s.gradingMethod === "Manual").length;
  const pending = submissions.filter((s) => s.status === "Submitted").length;

  function toggleFeedback(id: string) {
    setExpandedFeedback((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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

  async function runGradeWithAI(subId: string) {
    setAiGradingId(subId);
    const result = await gradeSubmissionWithAI(subId);
    setAiGradingId(null);
    if (result.status === "success") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message ?? "Auto-grading failed. Please grade manually.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              View and grade student submissions. Use &quot;Grade with AI&quot; for text and file submissions, or grade manually.
            </CardDescription>
          </div>
          {autoGradeEnabled && (
            <Badge variant="secondary" className="shrink-0">
              Auto-grading on
            </Badge>
          )}
        </div>
        {submissions.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {graded.length} graded ({autoGraded} auto, {manualGraded} manual), {pending} pending
          </p>
        )}
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border p-4 space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={sub.status === "Graded" ? "default" : "secondary"}>
                      {sub.status}
                    </Badge>
                    {sub.status === "Graded" && sub.gradingMethod === "AI" && (
                      <Badge variant="outline" className="text-xs">
                        AI
                      </Badge>
                    )}
                    {sub.status === "Graded" && sub.gradingMethod === "Manual" && (
                      <Badge variant="outline" className="text-xs">
                        Manual
                      </Badge>
                    )}
                    {sub.status === "Graded" && sub.score != null && (
                      <span className="text-sm font-medium">
                        {maxScore != null ? `${sub.score} / ${maxScore}` : sub.score}
                      </span>
                    )}
                    {sub.status === "Submitted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!aiGradingId}
                        onClick={() => runGradeWithAI(sub.id)}
                      >
                        {aiGradingId === sub.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin mr-1" />
                            Grading…
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4 mr-1" />
                            Grade with AI
                          </>
                        )}
                      </Button>
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

                {/* Feedback section (collapsible) */}
                {sub.status === "Graded" && (sub.feedback || sub.teacherFeedback) && (
                  <div className="border-t pt-2">
                    <button
                      onClick={() => toggleFeedback(sub.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageSquare className="size-3.5" />
                      Feedback
                      {expandedFeedback.has(sub.id) ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                    {expandedFeedback.has(sub.id) && (
                      <div className="mt-2 space-y-3">
                        {sub.teacherFeedback && (
                          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Teacher Notes (only you see this)</span>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mt-1">{sub.teacherFeedback}</p>
                          </div>
                        )}
                        {sub.feedback && (
                          <div className="rounded-lg bg-muted/30 p-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Feedback (visible to student)</span>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mt-1">{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
          initialScore={selectedSubmission?.score ?? undefined}
          initialFeedback={selectedSubmission?.feedback ?? undefined}
        />
      )}
    </Card>
  );
}
