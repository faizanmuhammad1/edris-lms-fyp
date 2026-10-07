"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { FileText, Upload, Loader2, Download, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { submitAssignment, getSubmissionStatus } from "../actions";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Uploader } from "@/components/file-uploader/Uploader";
import { ASSIGNMENT_MAX_FILE_BYTES_DEFAULT, getAssignmentAcceptMap } from "@/lib/zodSchemas";

interface AssignmentType {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  maxScore: number | null;
  allowFile: boolean;
  allowText: boolean;
  autoGradeEnabled: boolean;
  allowedFileTypes: string | null;
  /** Optional: only enforced client-side when the loader selects it (server always enforces). */
  maxFileSizeBytes?: number | null;
  submissions: {
    id: string;
    fileKey: string | null;
    fileName: string | null;
    textAnswer: string | null;
    submittedAt: Date;
    status: string;
    score: number | null;
    feedback: string | null;
    gradedAt: Date | null;
    gradingMethod: string | null;
  }[];
}

interface LessonAssignmentCardProps {
  assignment: AssignmentType;
  slug: string;
  lessonId: string;
}

/** Shimmering dots animation for grading state */
function GradingAnimation() {
  return (
    <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-b from-blue-500/10 to-purple-500/10 p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Sparkles className="size-6 text-blue-500 animate-pulse" />
          <div className="absolute inset-0 animate-ping">
            <Sparkles className="size-6 text-blue-500/30" />
          </div>
        </div>
        <div>
          <span className="font-semibold text-foreground">AI is grading your submission</span>
          <p className="text-sm text-muted-foreground">This usually takes a few seconds…</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-2 flex-1 rounded-full bg-blue-500/20 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-grading-bar" />
        </div>
      </div>
      <style jsx>{`
        @keyframes grading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          90% { width: 90%; }
          100% { width: 95%; }
        }
        .animate-grading-bar {
          animation: grading-bar 8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export function LessonAssignmentCard({
  assignment,
  slug,
  lessonId,
}: LessonAssignmentCardProps) {
  const [pending, startTransition] = useTransition();
  const [fileKey, setFileKey] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");

  // Live submission state for polling
  const [liveSubmission, setLiveSubmission] = useState(assignment.submissions[0] ?? null);
  const [isPolling, setIsPolling] = useState(false);

  const mySubmission = liveSubmission;

  // Determine if we should poll
  const shouldPoll =
    mySubmission?.status === "Submitted" && assignment.autoGradeEnabled;

  // Poll for grading status
  const pollStatus = useCallback(async () => {
    if (!mySubmission?.id) return;
    const result = await getSubmissionStatus(mySubmission.id);
    if (result && result.status === "Graded") {
      setLiveSubmission((prev) =>
        prev
          ? {
              ...prev,
              status: result.status,
              score: result.score,
              feedback: result.feedback,
              gradedAt: result.gradedAt,
              gradingMethod: result.gradingMethod,
            }
          : prev
      );
      setIsPolling(false);
    }
  }, [mySubmission?.id]);

  useEffect(() => {
    if (!shouldPoll) {
      setIsPolling(false);
      return;
    }
    setIsPolling(true);
    // Start polling every 3 seconds
    const interval = setInterval(pollStatus, 3000);
    // Also poll immediately
    pollStatus();
    return () => clearInterval(interval);
  }, [shouldPoll, pollStatus]);

  function handleSubmit() {
    const hasFile = !!fileKey;
    const hasText = !!textAnswer.trim();
    if (assignment.allowFile && assignment.allowText && !hasFile && !hasText) {
      toast.error("Please provide a file and/or text answer");
      return;
    }
    if (assignment.allowFile && !assignment.allowText && !hasFile) {
      toast.error("Please upload a file");
      return;
    }
    if (assignment.allowText && !assignment.allowFile && !hasText) {
      toast.error("Please provide a text answer");
      return;
    }
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        submitAssignment(
          assignment.id,
          { fileKey: fileKey || undefined, fileName: fileName || undefined, fileSize: fileSize || undefined, mimeType: mimeType || undefined, textAnswer: textAnswer || undefined },
          slug,
          lessonId
        )
      );
      if (error) {
        toast.error("Something went wrong");
        return;
      }
      if (result?.status === "success") {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result?.message ?? "Failed to submit");
      }
    });
  }

  async function handleDownloadSubmission() {
    if (!mySubmission?.id || !mySubmission.fileKey) return;
    try {
      const res = await fetch("/api/assignment-submissions/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: mySubmission.id }),
      });
      if (!res.ok) throw new Error("Failed to get link");
      const { url } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = mySubmission.fileName ?? "submission";
      a.target = "_blank";
      a.click();
    } catch {
      toast.error("Could not download");
    }
  }

  const isGraded = mySubmission?.status === "Graded";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          {assignment.title}
        </CardTitle>
        {assignment.dueDate && (
          <CardDescription>
            Due: {new Date(assignment.dueDate).toLocaleString()}
          </CardDescription>
        )}
        {assignment.description && (() => {
          try {
            return (
              <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
                <RenderDescription json={JSON.parse(assignment.description)} />
              </div>
            );
          } catch {
            return <p className="text-sm mt-2">{assignment.description}</p>;
          }
        })()}
      </CardHeader>
      <CardContent className="space-y-4">
        {mySubmission ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Submitted {formatDistanceToNow(new Date(mySubmission.submittedAt), { addSuffix: true })}
              {assignment.dueDate && new Date(mySubmission.submittedAt) > new Date(assignment.dueDate) && (
                <Badge variant="secondary" className="text-xs">Late</Badge>
              )}
            </p>
            {mySubmission.fileName && (
              <Button variant="link" className="h-auto p-0 text-sm" onClick={handleDownloadSubmission}>
                <Download className="size-4 mr-1" />
                {mySubmission.fileName}
              </Button>
            )}
            {mySubmission.textAnswer && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                {mySubmission.textAnswer}
              </div>
            )}

            {/* AI Grading in progress animation */}
            {isPolling && !isGraded && <GradingAnimation />}

            {/* Waiting for manual grading */}
            {!isPolling && !isGraded && (
              <div className="rounded-xl border border-muted bg-muted/20 p-4 flex items-center gap-3">
                <Loader2 className="size-5 text-muted-foreground animate-spin shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground">Awaiting grading</span>
                  <p className="text-xs text-muted-foreground">Your instructor will review and grade your submission.</p>
                </div>
              </div>
            )}

            {isGraded && (
              <div className="rounded-xl border-2 border-green-500/30 bg-gradient-to-b from-green-500/10 to-green-500/5 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="font-semibold text-foreground">Your result</span>
                  {mySubmission.gradingMethod === "AI" && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="size-3" />
                      Automatically graded
                    </Badge>
                  )}
                  {mySubmission.gradingMethod === "Manual" && (
                    <Badge variant="outline" className="text-xs">
                      Graded by instructor
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-semibold text-foreground">
                  Score: {assignment.maxScore != null ? `${mySubmission.score} / ${assignment.maxScore}` : mySubmission.score}
                  {assignment.maxScore != null && typeof mySubmission.score === "number" && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({Math.round((mySubmission.score / assignment.maxScore) * 100)}%)
                    </span>
                  )}
                </p>
                {mySubmission.feedback && (
                  <div className="space-y-1 pt-1 border-t border-green-500/20">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</span>
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {mySubmission.feedback}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {assignment.allowFile && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium block">Upload file</label>
                  {assignment.allowedFileTypes && (
                    <span className="text-xs text-muted-foreground">
                      Accepted: {assignment.allowedFileTypes.split(",").map((t: string) => {
                        const labels: Record<string, string> = { pdf: "PDF", image: "Images", word: "Word", text: "Text", zip: "ZIP" };
                        return labels[t] ?? t;
                      }).join(", ")}
                    </span>
                  )}
                </div>
                <div className="w-full">
                  <Uploader
                    fileTypeAccepted={assignment.allowedFileTypes === "image" ? "image" : "document"}
                    accept={getAssignmentAcceptMap(assignment.allowedFileTypes)}
                    maxSize={
                      assignment.maxFileSizeBytes != null
                        ? assignment.maxFileSizeBytes
                        : assignment.maxFileSizeBytes === null
                          ? ASSIGNMENT_MAX_FILE_BYTES_DEFAULT
                          : 100 * 1024 * 1024 // limit not loaded: the upload route enforces it
                    }
                    value={fileKey}
                    onChange={(key: string) => {
                      setFileKey(key);
                      if (!key) {
                        setFileName("");
                        setFileSize(0);
                        setMimeType("");
                      }
                    }}
                    onUploadSuccess={(data: { key: string; name: string; size: number; type: string }) => {
                      setFileName(data.name);
                      setFileSize(data.size);
                      setMimeType(data.type);
                    }}
                    className="h-48"
                    // Presigned PUT straight to storage (no function body-size limit);
                    // the route validates enrollment and the assignment's type/size settings.
                    endpoint="/api/s3/upload-direct?useCase=assignment"
                    uploadParams={{ assignmentId: assignment.id }}
                  />
                </div>
                {fileName && fileKey && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-100">
                    <FileText className="size-4" />
                    <span className="truncate flex-1">{fileName}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {(fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>
            )}
            {assignment.allowText && (
              <div>
                <label className="text-sm font-medium mb-2 block">Text answer</label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer..."
                />
              </div>
            )}
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
              Submit
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
