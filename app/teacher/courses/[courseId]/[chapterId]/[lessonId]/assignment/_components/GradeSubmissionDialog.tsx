"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, Download, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { TeacherAssignmentType } from "@/app/data/teacher/get-teacher-assignment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { gradeSubmission, gradeSubmissionWithAI, type GradeWithAIResult } from "../actions";

export type AssignmentSubmissionRow = NonNullable<TeacherAssignmentType["assignment"]>["submissions"][number];

const SCORE_LIMIT = 10_000;

function buildGradeSchema(maxScore: number | null) {
  const upper = maxScore ?? SCORE_LIMIT;
  return z.object({
    score: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= upper), {
        message: `Enter a whole number from 0 to ${upper.toLocaleString()}`,
      }),
    feedback: z.string().max(10_000, "Keep feedback under 10,000 characters"),
  });
}

type GradeFormValues = z.infer<ReturnType<typeof buildGradeSchema>>;

function friendlyAiError(code: Extract<GradeWithAIResult, { status: "error" }>["code"]) {
  if (code === "NO_CONTENT") return "This submission is empty, so AI can't grade it. Grade it manually below.";
  if (code === "MANUAL_REQUIRED") return "AI couldn't read the submitted file. Grade it manually below.";
  return "AI grading is unavailable right now. Grade it manually below.";
}

/** Opens a short-lived signed download link for a submission's file in a new tab. */
export async function openSubmissionFile(submissionId: string) {
  try {
    const res = await fetch("/api/assignment-submissions/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    });
    if (!res.ok) throw new Error("Failed to get link");
    const { url } = await res.json();
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    toast.error("Couldn't open the file. Please try again.");
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface GradeSubmissionDialogProps {
  /** The submission being graded; null/empty closes the dialog. */
  submissionId: string | null;
  onClose: () => void;
  maxScore: number | null;
  initialScore?: number | null;
  initialFeedback?: string | null;
  /** Full submission details (student, answer, file, AI notes). */
  submission?: AssignmentSubmissionRow | null;
  /** Disables the AI button while another AI grading run is in progress. */
  aiBusy?: boolean;
}

export function GradeSubmissionDialog({
  submissionId,
  onClose,
  maxScore,
  initialScore,
  initialFeedback,
  submission,
  aiBusy = false,
}: GradeSubmissionDialogProps) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [prevSubmissionId, setPrevSubmissionId] = useState(submissionId);

  const schema = useMemo(() => buildGradeSchema(maxScore), [maxScore]);
  const currentScore = submission ? submission.score : initialScore;
  const currentFeedback = submission ? submission.feedback : initialFeedback;
  const scoreDefault = currentScore != null ? String(currentScore) : "";
  const feedbackDefault = currentFeedback ?? "";

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { score: scoreDefault, feedback: feedbackDefault },
  });

  // Clear the previous submission's AI message when switching submissions.
  if (submissionId !== prevSubmissionId) {
    setPrevSubmissionId(submissionId);
    setAiError(null);
  }

  // Load the latest saved grade when the dialog opens another submission or after AI grading refreshes it.
  useEffect(() => {
    form.reset({ score: scoreDefault, feedback: feedbackDefault });
  }, [submissionId, scoreDefault, feedbackDefault, form]);

  const busy = pending || aiPending;
  const isGraded = submission?.status === "Graded";

  function close() {
    if (busy) return;
    onClose();
  }

  async function handleGradeWithAI() {
    if (!submissionId) return;
    setAiPending(true);
    setAiError(null);
    try {
      const result = await gradeSubmissionWithAI(submissionId);
      if (result.status === "success") {
        toast.success("Graded with AI. Review the score and feedback below.");
        router.refresh();
      } else {
        const message = friendlyAiError(result.code);
        setAiError(message);
        toast.error(message);
      }
    } catch {
      const message = friendlyAiError(undefined);
      setAiError(message);
      toast.error(message);
    } finally {
      setAiPending(false);
    }
  }

  function onSubmit(values: GradeFormValues) {
    if (!submissionId) return;
    startTransition(async () => {
      try {
        const result = await gradeSubmission(submissionId, {
          score: values.score === "" ? undefined : Number(values.score),
          feedback: values.feedback.trim() || undefined,
        });
        if (result.status === "success") {
          toast.success("Grade saved");
          onClose();
          router.refresh();
        } else {
          form.setError("root", { message: result.message });
          toast.error(result.message);
        }
      } catch {
        const message = "Couldn't save the grade. Please try again.";
        form.setError("root", { message });
        toast.error(message);
      }
    });
  }

  const studentName = submission?.User.name || submission?.User.email || "Student";
  const submittedAt = submission ? new Date(submission.submittedAt) : null;
  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog open={!!submissionId} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isGraded ? "Review grade" : "Grade submission"}</DialogTitle>
          <DialogDescription className="break-words">
            {submission ? (
              <>
                {studentName}
                {submittedAt && <> · submitted {formatDistanceToNow(submittedAt, { addSuffix: true })}</>}
              </>
            ) : (
              "Give a score and feedback for this submission."
            )}
          </DialogDescription>
        </DialogHeader>

        {submission && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={isGraded ? "default" : "secondary"}>{isGraded ? "Graded" : "Needs grading"}</Badge>
              {isGraded && submission.gradingMethod && (
                <Badge variant="outline">{submission.gradingMethod === "AI" ? "Graded by AI" : "Graded manually"}</Badge>
              )}
              {submittedAt && (
                <time dateTime={submittedAt.toISOString()} className="text-muted-foreground">
                  {format(submittedAt, "PPp")}
                </time>
              )}
            </div>

            {submission.fileName && (
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 w-full justify-start whitespace-normal py-2 text-left"
                onClick={() => openSubmissionFile(submission.id)}
              >
                <Download className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-all">
                  <span className="sr-only">Download </span>
                  {submission.fileName}
                  {submission.fileSize != null && (
                    <span className="ml-1 text-muted-foreground">({formatFileSize(submission.fileSize)})</span>
                  )}
                </span>
              </Button>
            )}

            {submission.textAnswer?.trim() && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium" id={`${id}-answer`}>
                  Text answer
                </h3>
                <div
                  className="max-h-48 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed break-words whitespace-pre-wrap"
                  tabIndex={0}
                  role="region"
                  aria-labelledby={`${id}-answer`}
                >
                  {submission.textAnswer}
                </div>
              </div>
            )}

            {submission.teacherFeedback && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">AI notes for you</h3>
                <p className="text-xs text-muted-foreground">Students don&apos;t see these notes.</p>
                <p className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {submission.teacherFeedback}
                </p>
              </div>
            )}

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {isGraded ? "Re-grading replaces the current score and feedback." : "Let AI suggest a score and feedback."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0"
                  onClick={handleGradeWithAI}
                  disabled={busy || aiBusy}
                  aria-busy={aiPending}
                >
                  {aiPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : isGraded ? (
                    <RotateCcw className="size-4" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-4" aria-hidden="true" />
                  )}
                  {aiPending ? "Grading with AI…" : isGraded ? "Re-grade with AI" : "Grade with AI"}
                </Button>
              </div>
              {aiError && (
                <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {aiError}
                </p>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{maxScore != null ? `Score (out of ${maxScore})` : "Score"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={maxScore ?? SCORE_LIMIT}
                      step={1}
                      placeholder="Optional"
                      className="h-10 w-full sm:w-40"
                      disabled={busy}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Whole number. Leave empty to mark as graded without a score.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback for the student (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What went well, and what to improve"
                      className="max-h-64 min-h-28 resize-y"
                      disabled={busy}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>The student sees this with their grade.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rootError && (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {rootError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="h-10" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" className="h-10" disabled={busy} aria-busy={pending}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {pending ? "Saving…" : "Save grade"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
