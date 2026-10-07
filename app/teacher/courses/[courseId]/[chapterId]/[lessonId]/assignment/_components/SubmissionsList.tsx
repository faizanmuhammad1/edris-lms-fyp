"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, Inbox, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gradeSubmissionWithAI } from "../actions";
import { GradeSubmissionDialog, type AssignmentSubmissionRow } from "./GradeSubmissionDialog";

type StatusFilter = "all" | "pending" | "graded";

interface SubmissionsListProps {
  assignmentId: string;
  maxScore: number | null;
  autoGradeEnabled: boolean;
  submissions: AssignmentSubmissionRow[];
}

function studentLabel(sub: AssignmentSubmissionRow) {
  return sub.User.name || sub.User.email || "Student";
}

function submissionTypeLabel(sub: AssignmentSubmissionRow): string | null {
  const hasFile = !!sub.fileKey;
  const hasText = !!sub.textAnswer?.trim();
  if (hasFile && hasText) return "File + text";
  if (hasFile) {
    const mime = sub.mimeType || "";
    if (mime.startsWith("image/")) return "Image";
    if (mime === "application/pdf") return "PDF";
    if (mime.includes("word")) return "Word";
    return "File";
  }
  if (hasText) return "Text";
  return null;
}

function StatusBadge({ sub, grading }: { sub: AssignmentSubmissionRow; grading: boolean }) {
  if (grading) {
    return (
      <Badge variant="outline">
        <Loader2 className="animate-spin" aria-hidden="true" />
        Grading…
      </Badge>
    );
  }
  if (sub.status === "Graded") {
    return (
      <Badge>
        <CheckCircle2 aria-hidden="true" />
        {sub.gradingMethod === "AI" ? "Graded by AI" : "Graded"}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock aria-hidden="true" />
      Needs grading
    </Badge>
  );
}

function ScoreText({ sub, maxScore }: { sub: AssignmentSubmissionRow; maxScore: number | null }) {
  if (sub.status !== "Graded" || sub.score == null) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No score</span>
      </span>
    );
  }
  return <span className="font-medium tabular-nums">{maxScore != null ? `${sub.score} / ${maxScore}` : sub.score}</span>;
}

function SubmittedTime({ date }: { date: Date }) {
  const d = new Date(date);
  return (
    <time dateTime={d.toISOString()} title={format(d, "PPpp")} className="whitespace-nowrap">
      {formatDistanceToNow(d, { addSuffix: true })}
    </time>
  );
}

export function SubmissionsList({ maxScore, autoGradeEnabled, submissions }: SubmissionsListProps) {
  const router = useRouter();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [aiGradingId, setAiGradingId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const selectedSubmission = gradingId ? submissions.find((s) => s.id === gradingId) ?? null : null;

  const graded = submissions.filter((s) => s.status === "Graded");
  const autoGraded = graded.filter((s) => s.gradingMethod === "AI").length;
  const manualGraded = graded.filter((s) => s.gradingMethod === "Manual").length;
  const pendingSubmissions = submissions.filter((s) => s.status === "Submitted");
  const pendingCount = pendingSubmissions.length;
  const bulkGrading = bulkProgress !== null;

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? submissions
        : submissions.filter((s) => (statusFilter === "graded" ? s.status === "Graded" : s.status !== "Graded")),
    [submissions, statusFilter]
  );

  async function runBulkGradeWithAI() {
    if (pendingCount === 0) return;
    const queue = [...pendingSubmissions];
    setBulkProgress({ done: 0, total: queue.length });
    let successCount = 0;
    let failCount = 0;

    for (const sub of queue) {
      setAiGradingId(sub.id);
      try {
        const result = await gradeSubmissionWithAI(sub.id);
        if (result.status === "success") successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
      setBulkProgress({ done: successCount + failCount, total: queue.length });
    }

    setAiGradingId(null);
    setBulkProgress(null);

    if (successCount > 0) {
      toast.success(
        `AI graded ${successCount} submission${successCount === 1 ? "" : "s"}${
          failCount > 0 ? `. ${failCount} couldn't be graded by AI; grade them manually.` : "."
        }`
      );
    } else if (failCount > 0) {
      toast.error("AI grading is unavailable right now. Grade the submissions manually.");
    }
    router.refresh();
  }

  const columns = useMemo<ColumnDef<AssignmentSubmissionRow>[]>(
    () => [
      {
        id: "student",
        accessorFn: (row) => studentLabel(row).toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Student" />,
        cell: ({ row }) => {
          const sub = row.original;
          return (
            <div className="max-w-56 min-w-0">
              <p className="truncate font-medium" title={studentLabel(sub)}>
                {studentLabel(sub)}
              </p>
              {sub.User.name && sub.User.email && (
                <p className="truncate text-xs text-muted-foreground" title={sub.User.email}>
                  {sub.User.email}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "submittedAt",
        accessorFn: (row) => new Date(row.submittedAt).getTime(),
        header: ({ column }) => <SortableHeader column={column} title="Submitted" />,
        cell: ({ row }) => <SubmittedTime date={row.original.submittedAt} />,
      },
      {
        id: "type",
        header: "Submission",
        cell: ({ row }) => {
          const label = submissionTypeLabel(row.original);
          return (
            <div className="flex max-w-48 min-w-0 flex-col gap-1">
              {label ? <Badge variant="outline">{label}</Badge> : <span className="text-muted-foreground">Empty</span>}
              {row.original.fileName && (
                <span className="truncate text-xs text-muted-foreground" title={row.original.fileName}>
                  {row.original.fileName}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (row) => (row.status === "Graded" ? 1 : 0),
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge sub={row.original} grading={aiGradingId === row.original.id} />,
      },
      {
        id: "score",
        accessorFn: (row) => (row.status === "Graded" && row.score != null ? row.score : -1),
        header: ({ column }) => <SortableHeader column={column} title="Score" />,
        cell: ({ row }) => <ScoreText sub={row.original} maxScore={maxScore} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const sub = row.original;
          const isGraded = sub.status === "Graded";
          return (
            <div className="flex justify-end">
              <Button
                variant={isGraded ? "outline" : "default"}
                size="sm"
                onClick={() => setGradingId(sub.id)}
                aria-label={`${isGraded ? "Review grade for" : "Grade"} ${studentLabel(sub)}`}
              >
                {isGraded ? "Review" : "Grade"}
              </Button>
            </div>
          );
        },
      },
    ],
    [aiGradingId, maxScore]
  );

  return (
    <section aria-labelledby="submissions-heading" className="min-w-0">
      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h2 id="submissions-heading" className="text-lg font-semibold leading-none">
              Submissions
            </h2>
            <CardDescription>
              Review and grade student work. AI grading supports text, images, PDFs and Word documents.
            </CardDescription>
            {submissions.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {graded.length} graded ({autoGraded} by AI, {manualGraded} manually) · {pendingCount} need
                {pendingCount === 1 ? "s" : ""} grading
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            {autoGradeEnabled && <Badge variant="secondary">Auto-grading on</Badge>}
            {pendingCount > 0 && (
              <Button
                className="h-10 w-full sm:w-auto"
                disabled={bulkGrading || !!aiGradingId}
                onClick={runBulkGradeWithAI}
                aria-busy={bulkGrading}
              >
                {bulkProgress ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Zap className="size-4" aria-hidden="true" />
                )}
                {bulkProgress
                  ? `Grading ${Math.min(bulkProgress.done + 1, bulkProgress.total)} of ${bulkProgress.total}…`
                  : `Grade ${pendingCount} pending with AI`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              titleAs="h3"
              title="No submissions yet"
              description="When students hand in work for this assignment, it shows up here for grading."
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              getRowId={(row) => row.id}
              getSearchText={(row) => `${row.User.name ?? ""} ${row.User.email ?? ""}`}
              searchPlaceholder="Search by student name or email"
              noResultsText="No submissions match your search or filter."
              caption="Assignment submissions"
              toolbar={
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All submissions</SelectItem>
                    <SelectItem value="pending">Needs grading</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                  </SelectContent>
                </Select>
              }
              renderMobileCard={(sub) => {
                const label = submissionTypeLabel(sub);
                const isGraded = sub.status === "Graded";
                return (
                  <div className="space-y-3 rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={studentLabel(sub)}>
                          {studentLabel(sub)}
                        </p>
                        {sub.User.name && sub.User.email && (
                          <p className="truncate text-sm text-muted-foreground" title={sub.User.email}>
                            {sub.User.email}
                          </p>
                        )}
                      </div>
                      <StatusBadge sub={sub} grading={aiGradingId === sub.id} />
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Submitted</dt>
                        <dd>
                          <SubmittedTime date={sub.submittedAt} />
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Score</dt>
                        <dd>
                          <ScoreText sub={sub} maxScore={maxScore} />
                        </dd>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <dt className="text-xs text-muted-foreground">Submission</dt>
                        <dd className="truncate" title={sub.fileName ?? undefined}>
                          {label ?? "Empty"}
                          {sub.fileName && <span className="text-muted-foreground"> · {sub.fileName}</span>}
                        </dd>
                      </div>
                    </dl>
                    <Button
                      variant={isGraded ? "outline" : "default"}
                      className="h-10 w-full"
                      onClick={() => setGradingId(sub.id)}
                      aria-label={`${isGraded ? "Review grade for" : "Grade submission from"} ${studentLabel(sub)}`}
                    >
                      {isGraded ? "Review grade" : "Grade submission"}
                    </Button>
                  </div>
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      <GradeSubmissionDialog
        submissionId={gradingId}
        onClose={() => setGradingId(null)}
        maxScore={maxScore}
        submission={selectedSubmission}
        aiBusy={bulkGrading}
      />
    </section>
  );
}
