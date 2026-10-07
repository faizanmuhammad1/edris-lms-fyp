"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuizAttemptDetail } from "@/components/quiz-attempt-detail/QuizAttemptDetail";
import { StudentIdentity } from "@/app/teacher/students/_components/StudentIdentity";
import { formatDate } from "@/app/teacher/_components/format";
import { gradeSubmission } from "@/app/teacher/courses/[courseId]/[chapterId]/[lessonId]/assignment/actions";
import { cn } from "@/lib/utils";
import { IntegrityBadge, PassBadge, ScoreBar, SubmissionStatusBadge } from "./ProgressBadges";
import { formatSubmissionScore } from "./SubmissionsTable";
import {
  attemptDate,
  getTotalViolations,
  toDetailData,
  type QuizAttempt,
  type StudentSummary,
  type Submission,
} from "./progress-utils";

export type DetailView =
  | { kind: "student"; studentId: string }
  | { kind: "attempt"; attemptId: string; backTo?: string }
  | { kind: "grade"; submissionId: string; backTo?: string };

interface ProgressDetailDialogProps {
  open: boolean;
  /** Kept while closing so the content doesn't vanish during the exit animation. */
  view: DetailView | null;
  /** Pass a view to navigate (and open); null closes the dialog. */
  onViewChange: (view: DetailView | null) => void;
  students: StudentSummary[];
  attempts: QuizAttempt[];
  submissions: Submission[];
  /** Called after a grade is saved so the page can refetch. */
  onGraded: () => void;
}

/** One dialog for student progress, attempt details and grading, with "back" navigation between them. */
export function ProgressDetailDialog({
  open,
  view,
  onViewChange,
  students,
  attempts,
  submissions,
  onGraded,
}: ProgressDetailDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const viewKey = view ? `${view.kind}:${"studentId" in view ? view.studentId : "attemptId" in view ? view.attemptId : view.submissionId}` : "";

  // Move focus to the new title when navigating inside the dialog (the clicked button unmounts).
  useEffect(() => {
    if (viewKey) titleRef.current?.focus();
  }, [viewKey]);

  const backTo = view && view.kind !== "student" ? view.backTo : undefined;
  const backStudent = backTo ? students.find((s) => s.id === backTo) : undefined;
  const goBack = backStudent ? () => onViewChange({ kind: "student", studentId: backStudent.id }) : undefined;

  let content: React.ReactNode = null;
  let wide = true;

  if (view?.kind === "student") {
    const student = students.find((s) => s.id === view.studentId);
    content = student ? (
      <StudentView
        student={student}
        titleRef={titleRef}
        onViewAttempt={(a) => onViewChange({ kind: "attempt", attemptId: a.id, backTo: student.id })}
        onGrade={(s) => onViewChange({ kind: "grade", submissionId: s.id, backTo: student.id })}
      />
    ) : (
      <Missing titleRef={titleRef} />
    );
  } else if (view?.kind === "attempt") {
    const attempt = attempts.find((a) => a.id === view.attemptId);
    content = attempt ? (
      <>
        <DialogHeader className="pr-8">
          {goBack && <BackButton name={backStudent!.name} onClick={goBack} />}
          <DialogTitle ref={titleRef} tabIndex={-1} className="outline-none">
            Attempt details
          </DialogTitle>
          <DialogDescription className="break-words">
            {attempt.student.name} &middot; {attempt.quiz.title}
          </DialogDescription>
        </DialogHeader>
        <QuizAttemptDetail attempt={toDetailData(attempt)} />
      </>
    ) : (
      <Missing titleRef={titleRef} />
    );
  } else if (view?.kind === "grade") {
    wide = false;
    const submission = submissions.find((s) => s.id === view.submissionId);
    content = submission ? (
      <GradeView
        key={submission.id}
        submission={submission}
        titleRef={titleRef}
        backButton={goBack ? <BackButton name={backStudent!.name} onClick={goBack} /> : null}
        onCancel={() => (goBack ? goBack() : onViewChange(null))}
        onSaved={() => {
          onGraded();
          if (goBack) goBack();
          else onViewChange(null);
        }}
      />
    ) : (
      <Missing titleRef={titleRef} />
    );
  }

  return (
    <Dialog open={open && view !== null} onOpenChange={(next) => !next && onViewChange(null)}>
      <DialogContent
        className={cn("max-h-[90dvh] overflow-y-auto overflow-x-hidden", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}

function BackButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2 mb-1 w-fit max-w-full" onClick={onClick}>
      <ArrowLeft aria-hidden="true" />
      <span className="truncate">Back to {name}</span>
    </Button>
  );
}

function Missing({ titleRef }: { titleRef: React.Ref<HTMLHeadingElement> }) {
  return (
    <DialogHeader>
      <DialogTitle ref={titleRef} tabIndex={-1} className="outline-none">
        No longer available
      </DialogTitle>
      <DialogDescription>This item was removed or is outside the selected course. Close this dialog to continue.</DialogDescription>
    </DialogHeader>
  );
}

function StudentView({
  student,
  titleRef,
  onViewAttempt,
  onGrade,
}: {
  student: StudentSummary;
  titleRef: React.Ref<HTMLHeadingElement>;
  onViewAttempt: (a: QuizAttempt) => void;
  onGrade: (s: Submission) => void;
}) {
  return (
    <>
      <DialogHeader className="pr-8">
        <DialogTitle ref={titleRef} tabIndex={-1} className="break-words outline-none">
          {student.name}&apos;s progress
        </DialogTitle>
        <DialogDescription className="break-words">{student.courses.join(", ")}</DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
          <StudentIdentity name={student.name} email={student.email} image={student.image} className="sm:col-span-3" />
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Average quiz score</p>
            {student.averageScore != null ? (
              <ScoreBar value={student.averageScore} label={`${student.name}'s average quiz score`} />
            ) : (
              <p className="text-sm">No quizzes taken</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Quizzes passed</p>
            <p className="text-sm font-medium">
              {student.passedCount} of {student.attempts.length}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Assignments to grade</p>
            <p className="text-sm font-medium">{student.needsGrading}</p>
          </div>
        </div>

        <section aria-labelledby="student-attempts-heading" className="space-y-3">
          <h3 id="student-attempts-heading" className="text-sm font-semibold">
            Quiz attempts ({student.attempts.length})
          </h3>
          {student.attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {student.attempts.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <p className="break-words text-sm font-medium">{a.quiz.title}</p>
                    <p className="break-words text-xs text-muted-foreground">
                      {a.course.title} &middot; {formatDate(attemptDate(a))}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">{a.score}%</span>
                      <PassBadge passed={a.passed} />
                      <IntegrityBadge total={getTotalViolations(a)} />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-full shrink-0 sm:h-8 sm:w-auto"
                    onClick={() => onViewAttempt(a)}
                    aria-label={`View attempt on ${a.quiz.title}`}
                  >
                    <Eye aria-hidden="true" />
                    View
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="student-submissions-heading" className="space-y-3">
          <h3 id="student-submissions-heading" className="text-sm font-semibold">
            Assignment submissions ({student.submissions.length})
          </h3>
          {student.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignment submissions yet.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {student.submissions.map((s) => (
                <li key={s.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <p className="break-words text-sm font-medium">{s.assignment.title}</p>
                    <p className="break-words text-xs text-muted-foreground">
                      {s.course.title} &middot; Submitted {formatDate(s.submittedAt)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <SubmissionStatusBadge status={s.status} />
                      <span className="text-sm tabular-nums">{formatSubmissionScore(s)}</span>
                    </div>
                  </div>
                  <Button
                    variant={s.status === "Graded" ? "outline" : "default"}
                    size="sm"
                    className="h-10 w-full shrink-0 sm:h-8 sm:w-auto"
                    onClick={() => onGrade(s)}
                    aria-label={`${s.status === "Graded" ? "Edit grade for" : "Grade"} ${s.assignment.title}`}
                  >
                    <PencilLine aria-hidden="true" />
                    {s.status === "Graded" ? "Edit grade" : "Grade"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function GradeView({
  submission,
  titleRef,
  backButton,
  onCancel,
  onSaved,
}: {
  submission: Submission;
  titleRef: React.Ref<HTMLHeadingElement>;
  backButton: React.ReactNode;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const maxScore = submission.assignment.maxScore;
  const [score, setScore] = useState(submission.score != null ? String(submission.score) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scoreId = useId();
  const feedbackId = useId();
  const errorId = useId();
  const lessonHref = `/teacher/courses/${submission.courseId}/${submission.chapterId}/${submission.lessonId}/assignment`;

  function validate(): number | undefined | false {
    const trimmed = score.trim();
    if (trimmed === "") return undefined;
    const value = Number(trimmed);
    const upper = maxScore ?? 10000;
    if (!Number.isInteger(value) || value < 0 || value > upper) {
      setScoreError(`Enter a whole number from 0 to ${upper}, or leave it empty.`);
      return false;
    }
    setScoreError(null);
    return value;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = validate();
    if (value === false) return;
    startTransition(async () => {
      try {
        const result = await gradeSubmission(submission.id, {
          score: value,
          feedback: feedback.trim() || undefined,
        });
        if (result.status === "success") {
          toast.success(result.message);
          onSaved();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Couldn't save the grade. Please try again.");
      }
    });
  }

  return (
    <>
      <DialogHeader className="pr-8">
        {backButton}
        <DialogTitle ref={titleRef} tabIndex={-1} className="outline-none">
          {submission.status === "Graded" ? "Edit grade" : "Grade submission"}
        </DialogTitle>
        <DialogDescription className="break-words">
          {submission.student.name} &middot; {submission.assignment.title}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
        <p className="text-xs text-muted-foreground">
          Submitted {formatDate(submission.submittedAt)} &middot; {submission.course.title}
        </p>
        {submission.textAnswer?.trim() ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Answer</p>
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words">{submission.textAnswer}</p>
          </div>
        ) : null}
        {submission.fileName ? (
          <p className="break-words">
            <span className="text-xs font-medium text-muted-foreground">Attached file: </span>
            {submission.fileName}
          </p>
        ) : null}
        <Link href={lessonHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
          Open in the lesson (files and AI grading)
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor={scoreId}>Score{maxScore != null ? ` (out of ${maxScore})` : ""}</Label>
          <Input
            id={scoreId}
            type="number"
            inputMode="numeric"
            min={0}
            max={maxScore ?? undefined}
            step={1}
            placeholder="Optional"
            value={score}
            onChange={(e) => {
              setScore(e.target.value);
              if (scoreError) setScoreError(null);
            }}
            aria-invalid={scoreError ? true : undefined}
            aria-describedby={scoreError ? errorId : undefined}
            disabled={pending}
          />
          {scoreError && (
            <p id={errorId} className="text-sm text-destructive">
              {scoreError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={feedbackId}>Feedback (optional)</Label>
          <Textarea
            id={feedbackId}
            className="min-h-28"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write feedback for the student..."
            disabled={pending}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" className="h-10 sm:h-9" disabled={pending} aria-busy={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Save grade
          </Button>
        </div>
      </form>
    </>
  );
}
