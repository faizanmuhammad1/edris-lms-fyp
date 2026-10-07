"use client";

import { useState, useEffect, useTransition, useCallback, useId, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Loader2, Download, CheckCircle2, Sparkles, Clock, CalendarClock } from "lucide-react";
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
  /** Instructions rendered on the server (rich text). */
  description?: ReactNode;
  slug: string;
  lessonId: string;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "Images",
  word: "Word",
  text: "Text",
  zip: "ZIP",
};

/** Poll every 3s for up to ~3 minutes while AI grading runs. */
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60;

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function LessonAssignmentCard({ assignment, description, slug, lessonId }: LessonAssignmentCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileKey, setFileKey] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const textId = useId();
  const errorId = useId();
  const headingId = useId();

  // Live submission state for polling
  const [liveSubmission, setLiveSubmission] = useState(assignment.submissions[0] ?? null);
  const [pollCount, setPollCount] = useState(0);

  const mySubmission = liveSubmission;
  const isGraded = mySubmission?.status === "Graded";
  const shouldPoll = mySubmission?.status === "Submitted" && assignment.autoGradeEnabled;
  const pollingTimedOut = pollCount >= MAX_POLLS;
  const isPolling = shouldPoll && !pollingTimedOut;

  const pollStatus = useCallback(async () => {
    if (!mySubmission?.id) return;
    setPollCount((n) => n + 1);
    try {
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
      }
    } catch {
      // Network hiccup: the next poll retries.
    }
  }, [mySubmission?.id]);

  useEffect(() => {
    if (!isPolling) return;
    void pollStatus();
    const interval = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPolling, pollStatus]);

  function validate(): string | null {
    const hasFile = !!fileKey;
    const hasText = !!textAnswer.trim();
    if (assignment.allowFile && assignment.allowText && !hasFile && !hasText) {
      return "Upload a file or write a text answer before submitting.";
    }
    if (assignment.allowFile && !assignment.allowText && !hasFile) {
      return "Upload a file before submitting.";
    }
    if (assignment.allowText && !assignment.allowFile && !hasText) {
      return "Write your answer before submitting.";
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const error = validate();
    setFormError(error);
    if (error) {
      toast.error(error);
      return;
    }
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        submitAssignment(
          assignment.id,
          {
            fileKey: fileKey || undefined,
            fileName: fileName || undefined,
            fileSize: fileSize || undefined,
            mimeType: mimeType || undefined,
            textAnswer: textAnswer || undefined,
          },
          slug,
          lessonId
        )
      );
      if (error) {
        toast.error("We couldn't submit your assignment. Please try again.");
        return;
      }
      if (result?.status === "success") {
        toast.success("Assignment submitted");
        // The lesson page remounts this card with the new submission.
        router.refresh();
      } else {
        const message = result?.message ?? "We couldn't submit your assignment. Please try again.";
        setFormError(message);
        toast.error(message);
      }
    });
  }

  async function handleDownloadSubmission() {
    if (!mySubmission?.id || !mySubmission.fileKey || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/assignment-submissions/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: mySubmission.id }),
      });
      if (!res.ok) throw new Error("Failed to get link");
      const { url } = await res.json();
      // The link is served as an attachment, so this downloads without leaving the page
      // (and isn't blocked like a pop-up on mobile browsers).
      window.location.assign(url);
    } catch {
      toast.error("We couldn't download your file. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const acceptedLabel = assignment.allowedFileTypes
    ? assignment.allowedFileTypes
        .split(",")
        .map((t) => FILE_TYPE_LABELS[t.trim()] ?? t.trim())
        .join(", ")
    : null;
  const isLate =
    !!assignment.dueDate && !!mySubmission && new Date(mySubmission.submittedAt) > new Date(assignment.dueDate);

  return (
    <Card aria-labelledby={headingId} role="region">
      <CardHeader>
        <CardTitle className="flex items-start gap-2">
          <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <h2 id={headingId} className="text-lg leading-snug font-semibold break-words">
            <span className="sr-only">Assignment: </span>
            {assignment.title}
          </h2>
        </CardTitle>
        {assignment.dueDate && (
          <CardDescription className="flex items-center gap-1.5">
            <CalendarClock className="size-4" aria-hidden="true" />
            Due{" "}
            {new Date(assignment.dueDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </CardDescription>
        )}
        {description && <div className="mt-2 break-words">{description}</div>}
      </CardHeader>
      <CardContent className="space-y-4">
        {mySubmission ? (
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              Submitted {formatDistanceToNow(new Date(mySubmission.submittedAt), { addSuffix: true })}
              {isLate && (
                <Badge variant="secondary" className="text-xs">
                  Late
                </Badge>
              )}
            </p>
            {mySubmission.fileName && (
              <Button
                variant="outline"
                className="h-auto min-h-10 max-w-full justify-start whitespace-normal text-left"
                onClick={handleDownloadSubmission}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download aria-hidden="true" />
                )}
                <span className="min-w-0 break-all">
                  <span className="sr-only">Download your submission: </span>
                  {mySubmission.fileName}
                </span>
              </Button>
            )}
            {mySubmission.textAnswer && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap break-words">
                {mySubmission.textAnswer}
              </div>
            )}

            <div aria-live="polite">
              {isPolling && !isGraded && (
                <div className="flex items-center gap-3 rounded-xl border bg-primary/5 p-4">
                  <Sparkles className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">AI is grading your submission</p>
                    <p className="text-xs text-muted-foreground">This usually takes a few seconds.</p>
                  </div>
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
                </div>
              )}

              {!isPolling && !isGraded && (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                  <Clock className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Awaiting grading</p>
                    <p className="text-xs text-muted-foreground">
                      {shouldPoll && pollingTimedOut
                        ? "Grading is taking longer than usual. Check back later."
                        : "Your instructor will review and grade your submission."}
                    </p>
                  </div>
                </div>
              )}

              {isGraded && (
                <div className="space-y-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                    <span className="font-semibold text-foreground">Graded</span>
                    {mySubmission.gradingMethod === "AI" && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Sparkles className="size-3" aria-hidden="true" />
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
                    Score:{" "}
                    {assignment.maxScore != null
                      ? `${mySubmission.score} / ${assignment.maxScore}`
                      : mySubmission.score}
                    {assignment.maxScore != null && typeof mySubmission.score === "number" && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({Math.round((mySubmission.score / assignment.maxScore) * 100)}%)
                      </span>
                    )}
                  </p>
                  {mySubmission.feedback && (
                    <div className="space-y-1 border-t border-green-500/20 pt-2">
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Feedback</h3>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
                        {mySubmission.feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {assignment.allowFile && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-medium" id={`${textId}-file`}>
                    Upload file
                  </p>
                  {acceptedLabel && <span className="text-xs text-muted-foreground">Accepted: {acceptedLabel}</span>}
                </div>
                <div className="w-full" aria-labelledby={`${textId}-file`} role="group">
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
                      setFormError(null);
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
                  <p className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300">
                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate" title={fileName}>
                      {fileName}
                    </span>
                    <span className="text-xs whitespace-nowrap">{formatBytes(fileSize)}</span>
                  </p>
                )}
              </div>
            )}
            {assignment.allowText && (
              <div className="space-y-2">
                <Label htmlFor={textId}>
                  Text answer{!assignment.allowFile && <span className="text-destructive"> *</span>}
                </Label>
                <Textarea
                  id={textId}
                  className="min-h-[140px]"
                  value={textAnswer}
                  onChange={(e) => {
                    setTextAnswer(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Type your answer…"
                  disabled={pending}
                  aria-invalid={!!formError || undefined}
                  aria-describedby={formError ? errorId : undefined}
                />
                <p className="text-right text-xs text-muted-foreground tabular-nums">
                  {textAnswer.length.toLocaleString()} characters
                </p>
              </div>
            )}
            {formError && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
              {pending ? "Submitting…" : "Submit assignment"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
