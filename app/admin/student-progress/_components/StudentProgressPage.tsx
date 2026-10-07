"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  AlertTriangle,
  Award,
  ClipboardList,
  Eye,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { QuizAttemptDetail } from "@/components/quiz-attempt-detail/QuizAttemptDetail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatCard, StatGrid } from "@/app/admin/_components/StatCard";
import { StatusBadge, type BadgeTone } from "@/app/admin/_components/StatusBadge";
import { formatNumber, getInitials, pluralize } from "@/app/admin/_lib/format";
import { cn } from "@/lib/utils";
import {
  getAdminQuizAttemptDetail,
  getStudentProgressData,
  type AttemptDetailResult,
  type StudentProgressResult,
  type StudentProgressStudent,
  type StudentQuizAttempt,
} from "../actions";

const POLL_INTERVAL_MS = 5000;

type AttemptStatus = "passed" | "failed" | "in-progress";
type Severity = "clean" | "low" | "medium" | "high";

interface AttemptRow extends StudentQuizAttempt {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentImage: string | null;
  status: AttemptStatus;
  integrityTotal: number;
  severity: Severity;
  /** Submission time, or start time for unfinished attempts (ms). */
  activityAt: number;
}

type IntegrityKey =
  | "tabSwitchCount"
  | "backButtonCount"
  | "windowBlurCount"
  | "visibilityChangeCount"
  | "copyAttemptCount"
  | "pasteAttemptCount"
  | "rightClickCount"
  | "devToolsAttemptCount"
  | "screenshotAttemptCount"
  | "printAttemptCount";

const INTEGRITY_FIELDS: { key: IntegrityKey; label: string }[] = [
  { key: "tabSwitchCount", label: "Tab switch" },
  { key: "backButtonCount", label: "Back button" },
  { key: "windowBlurCount", label: "Focus lost" },
  { key: "visibilityChangeCount", label: "Page hidden" },
  { key: "copyAttemptCount", label: "Copy" },
  { key: "pasteAttemptCount", label: "Paste" },
  { key: "rightClickCount", label: "Right-click" },
  { key: "devToolsAttemptCount", label: "DevTools" },
  { key: "screenshotAttemptCount", label: "Screenshot" },
  { key: "printAttemptCount", label: "Print" },
];

const STATUS_META: Record<AttemptStatus, { label: string; tone: BadgeTone }> = {
  passed: { label: "Passed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  "in-progress": { label: "In progress", tone: "info" },
};

/** Same thresholds as the attempt detail view. */
const SEVERITY_META: Record<Severity, { label: string; tone: BadgeTone }> = {
  clean: { label: "Clean", tone: "success" },
  low: { label: "Low", tone: "info" },
  medium: { label: "Medium", tone: "warning" },
  high: { label: "High", tone: "danger" },
};

function getSeverity(total: number): Severity {
  if (total === 0) return "clean";
  if (total <= 2) return "low";
  if (total <= 5) return "medium";
  return "high";
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function toRows(students: StudentProgressStudent[]): AttemptRow[] {
  const rows: AttemptRow[] = [];
  for (const student of students) {
    for (const attempt of student.quizAttempts) {
      const integrityTotal = INTEGRITY_FIELDS.reduce((sum, field) => sum + attempt[field.key], 0);
      const finished = attempt.isCompleted || attempt.submittedAt !== null;
      rows.push({
        ...attempt,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        studentImage: student.image,
        status: !finished ? "in-progress" : attempt.passed ? "passed" : "failed",
        integrityTotal,
        severity: getSeverity(integrityTotal),
        activityAt: new Date(attempt.submittedAt ?? attempt.startedAt).getTime(),
      });
    }
  }
  // Newest activity first across all students.
  return rows.sort((a, b) => b.activityAt - a.activityAt);
}

/* ------------------------------------------------------------------ */
/* Cells                                                               */
/* ------------------------------------------------------------------ */

function StudentIdentity({ row }: { row: AttemptRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8 shrink-0">
        {row.studentImage && <AvatarImage src={row.studentImage} alt="" />}
        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
          {getInitials(row.studentName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="max-w-[14rem] truncate font-medium">{row.studentName}</p>
        <p className="max-w-[14rem] truncate text-xs text-muted-foreground">{row.studentEmail}</p>
      </div>
    </div>
  );
}

function ScoreBar({ row, className }: { row: AttemptRow; className?: string }) {
  const status = STATUS_META[row.status];
  const score = Math.min(Math.max(row.score, 0), 100);
  const passMark = Math.min(Math.max(row.passingScore, 0), 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{row.status === "in-progress" ? "—" : `${score}%`}</span>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <div className="relative">
        <Progress
          value={row.status === "in-progress" ? 0 : score}
          aria-label={`Score for ${row.quizTitle}`}
          className={cn("h-2", row.status === "failed" && "[&>[data-slot=progress-indicator]]:bg-destructive")}
        />
        <span
          className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60"
          style={{ left: `${passMark}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">Pass mark {passMark}%</p>
    </div>
  );
}

function IntegrityReport({ row }: { row: AttemptRow }) {
  const severity = SEVERITY_META[row.severity];
  const details = INTEGRITY_FIELDS.filter((field) => row[field.key] > 0);

  return (
    <div className="space-y-1">
      <StatusBadge tone={severity.tone}>
        {row.integrityTotal === 0 ? "Clean" : `${pluralize(row.integrityTotal, "flag")} · ${severity.label}`}
      </StatusBadge>
      {details.length > 0 && (
        <p className="max-w-[14rem] text-xs text-muted-foreground">
          {details.map((field) => `${field.label} ${row[field.key]}`).join(" · ")}
        </p>
      )}
    </div>
  );
}

function AttemptDate({ row }: { row: AttemptRow }) {
  const date = new Date(row.activityAt);
  return (
    <div className="space-y-0.5 text-sm">
      <time dateTime={date.toISOString()} className="block whitespace-nowrap" suppressHydrationWarning>
        {format(date, "MMM d, yyyy, h:mm a")}
      </time>
      <p className="text-xs text-muted-foreground">
        {row.submittedAt ? "Submitted" : "Started"} · {formatTime(row.timeSpent)} spent
      </p>
    </div>
  );
}

function ViewButton({ row, onView, className }: { row: AttemptRow; onView: (row: AttemptRow) => void; className?: string }) {
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => onView(row)}
      aria-label={`View attempt details: ${row.studentName}, ${row.quizTitle}`}
    >
      <Eye className="size-4" aria-hidden="true" />
      View
    </Button>
  );
}

function getColumns(onView: (row: AttemptRow) => void): ColumnDef<AttemptRow>[] {
  return [
    {
      id: "student",
      accessorFn: (row) => row.studentName,
      header: ({ column }) => <SortableHeader column={column} title="Student" />,
      cell: ({ row }) => <StudentIdentity row={row.original} />,
    },
    {
      id: "quiz",
      accessorFn: (row) => row.quizTitle,
      header: ({ column }) => <SortableHeader column={column} title="Quiz" />,
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[14rem]">
          <p className="truncate font-medium" title={row.original.quizTitle}>
            {row.original.quizTitle}
          </p>
          <p className="truncate text-xs text-muted-foreground" title={row.original.courseName}>
            {row.original.courseName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "score",
      header: ({ column }) => <SortableHeader column={column} title="Score" />,
      cell: ({ row }) => <ScoreBar row={row.original} className="w-40" />,
    },
    {
      accessorKey: "integrityTotal",
      header: ({ column }) => <SortableHeader column={column} title="Integrity" />,
      cell: ({ row }) => <IntegrityReport row={row.original} />,
    },
    {
      accessorKey: "activityAt",
      header: ({ column }) => <SortableHeader column={column} title="Date" />,
      cell: ({ row }) => <AttemptDate row={row.original} />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => <ViewButton row={row.original} onView={onView} />,
    },
  ];
}

function AttemptCard({ row, onView }: { row: AttemptRow; onView: (row: AttemptRow) => void }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <StudentIdentity row={row} />
      <div className="min-w-0">
        <p className="line-clamp-2 break-words font-medium">{row.quizTitle}</p>
        <p className="truncate text-xs text-muted-foreground">{row.courseName}</p>
      </div>
      <ScoreBar row={row} />
      <IntegrityReport row={row} />
      <AttemptDate row={row} />
      <ViewButton row={row} onView={onView} className="w-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type DetailState = { status: "idle" } | { status: "loading" } | AttemptDetailResult;

export function StudentProgressPage({ initialResult }: { initialResult: StudentProgressResult }) {
  const [students, setStudents] = useState<StudentProgressStudent[] | null>(
    initialResult.status === "success" ? initialResult.data : null
  );
  const [loadError, setLoadError] = useState<string | null>(
    initialResult.status === "error" ? initialResult.message : null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | AttemptStatus>("all");
  const [integrityFilter, setIntegrityFilter] = useState<"all" | "clean" | "flagged" | "high">("all");
  const [courseFilter, setCourseFilter] = useState("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<AttemptRow | null>(null);
  const [detail, setDetail] = useState<DetailState>({ status: "idle" });

  // Keep the same array reference when a poll returns identical data, so the table keeps its page.
  const signatureRef = useRef(initialResult.status === "success" ? JSON.stringify(initialResult.data) : "");
  const inFlightRef = useRef(false);
  const detailRequestRef = useRef(0);

  const refresh = useCallback(async ({ manual = false }: { manual?: boolean } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (manual) setIsRefreshing(true);
    try {
      const result = await getStudentProgressData();
      if (result.status === "success") {
        const signature = JSON.stringify(result.data);
        if (signature !== signatureRef.current) {
          signatureRef.current = signature;
          setStudents(result.data);
        }
        setLoadError(null);
      } else {
        setLoadError(result.message);
      }
    } catch {
      setLoadError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      inFlightRef.current = false;
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Live updates: poll while the tab is visible, and refresh as soon as it becomes visible again.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  const loadDetail = useCallback(async (attemptId: string) => {
    const requestId = ++detailRequestRef.current;
    setDetail({ status: "loading" });
    let result: AttemptDetailResult;
    try {
      result = await getAdminQuizAttemptDetail(attemptId);
    } catch {
      result = { status: "error", message: "Couldn't reach the server. Check your connection and try again." };
    }
    // Ignore responses for an attempt the admin has already navigated away from.
    if (requestId === detailRequestRef.current) setDetail(result);
  }, []);

  const openAttemptDetail = useCallback(
    (row: AttemptRow) => {
      setSelected(row);
      setSheetOpen(true);
      void loadDetail(row.id);
    },
    [loadDetail]
  );

  const columns = useMemo(() => getColumns(openAttemptDetail), [openAttemptDetail]);
  const rows = useMemo(() => (students ? toRows(students) : []), [students]);

  const courseOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.courseName))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  // A course can disappear between polls; fall back to "all" instead of hiding every row.
  const activeCourse = courseOptions.includes(courseFilter) ? courseFilter : "all";

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (statusFilter === "all" || row.status === statusFilter) &&
          (activeCourse === "all" || row.courseName === activeCourse) &&
          (integrityFilter === "all" ||
            (integrityFilter === "clean" && row.integrityTotal === 0) ||
            (integrityFilter === "flagged" && row.integrityTotal > 0) ||
            (integrityFilter === "high" && row.severity === "high"))
      ),
    [rows, statusFilter, activeCourse, integrityFilter]
  );

  const stats = useMemo(() => {
    const submitted = rows.filter((row) => row.status !== "in-progress");
    const passed = submitted.filter((row) => row.status === "passed").length;
    return {
      totalStudents: students?.length ?? 0,
      totalAttempts: rows.length,
      submitted: submitted.length,
      passed,
      passRate: submitted.length > 0 ? Math.round((passed / submitted.length) * 100) : 0,
      totalFlags: rows.reduce((sum, row) => sum + row.integrityTotal, 0),
      flaggedStudents: new Set(rows.filter((row) => row.integrityTotal > 0).map((row) => row.studentId)).size,
    };
  }, [rows, students]);

  const filtersActive = statusFilter !== "all" || integrityFilter !== "all" || activeCourse !== "all";

  const header = (
    <PageHeader
      title="Student progress"
      description="Monitor quiz performance and integrity flags across all students."
      actions={
        <>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live · updates every 5s
          </span>
          <Button
            variant="outline"
            onClick={() => void refresh({ manual: true })}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        </>
      }
    />
  );

  return (
    <div className="space-y-6">
      {header}

      {students === null ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5">
          <EmptyState
            className="border-0"
            icon={AlertTriangle}
            title="Student progress is unavailable"
            description={loadError ?? "Something went wrong while loading student progress."}
            action={
              <Button onClick={() => void refresh({ manual: true })} disabled={isRefreshing}>
                {isRefreshing ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="size-4" aria-hidden="true" />
                )}
                Try again
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {loadError && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Couldn&apos;t refresh. Showing the last loaded data; we&apos;ll keep retrying.</span>
            </p>
          )}

          <StatGrid columns={4}>
            <StatCard
              label="Students"
              value={formatNumber(stats.totalStudents)}
              icon={Users}
              description="With at least one quiz attempt"
            />
            <StatCard
              label="Quiz attempts"
              value={formatNumber(stats.totalAttempts)}
              icon={TrendingUp}
              description={`${formatNumber(stats.submitted)} submitted`}
            />
            <StatCard
              label="Pass rate"
              value={`${stats.passRate}%`}
              icon={Award}
              tone="success"
              description={
                stats.submitted > 0
                  ? `${formatNumber(stats.passed)} of ${formatNumber(stats.submitted)} passed`
                  : "No submitted attempts yet"
              }
            />
            <StatCard
              label="Integrity flags"
              value={formatNumber(stats.totalFlags)}
              icon={ShieldAlert}
              tone={stats.totalFlags > 0 ? "danger" : "neutral"}
              description={`${pluralize(stats.flaggedStudents, "student")} flagged`}
            />
          </StatGrid>

          <section aria-labelledby="quiz-reports-heading" className="space-y-4">
            <div className="space-y-1">
              <h2 id="quiz-reports-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
                Quiz reports
              </h2>
              <p className="text-sm text-muted-foreground">
                Every quiz attempt, newest first. Open an attempt to review answers and integrity events.
              </p>
            </div>

            <DataTable
              columns={columns}
              data={filteredRows}
              caption="Student quiz attempts"
              getRowId={(row) => row.id}
              getSearchText={(row) => `${row.studentName} ${row.studentEmail} ${row.quizTitle} ${row.courseName}`}
              searchPlaceholder="Search student, quiz or course"
              noResultsText={
                filtersActive ? "No attempts match your search and filters." : "No attempts match your search."
              }
              renderMobileCard={(row) => <AttemptCard row={row} onView={openAttemptDetail} />}
              toolbar={
                <>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                    <SelectTrigger className="w-full sm:w-36" aria-label="Filter by result">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All results</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="in-progress">In progress</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={integrityFilter}
                    onValueChange={(value) => setIntegrityFilter(value as typeof integrityFilter)}
                  >
                    <SelectTrigger className="w-full sm:w-40" aria-label="Filter by integrity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any integrity</SelectItem>
                      <SelectItem value="clean">Clean only</SelectItem>
                      <SelectItem value="flagged">Flagged only</SelectItem>
                      <SelectItem value="high">High risk only</SelectItem>
                    </SelectContent>
                  </Select>
                  {courseOptions.length > 1 && (
                    <Select value={activeCourse} onValueChange={setCourseFilter}>
                      <SelectTrigger className="w-full sm:w-48" aria-label="Filter by course">
                        <SelectValue className="min-w-0" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[min(24rem,calc(100vw-2rem))]">
                        <SelectItem value="all">All courses</SelectItem>
                        {courseOptions.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              }
              emptyState={
                // Only when nobody has taken a quiz; empty filter results keep the toolbar visible.
                rows.length === 0 ? (
                  <EmptyState
                    titleAs="h3"
                    icon={ClipboardList}
                    title="No quiz attempts yet"
                    description="Student quiz results and integrity reports will appear here as soon as students take quizzes."
                  />
                ) : undefined
              }
            />
          </section>
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="pr-12">
            <SheetTitle>Attempt details</SheetTitle>
            <SheetDescription>
              {selected ? `${selected.studentName} · ${selected.quizTitle}` : "Quiz attempt"}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {detail.status === "loading" || detail.status === "idle" ? (
              <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
                Loading attempt…
              </div>
            ) : detail.status === "success" ? (
              <QuizAttemptDetail attempt={detail.data} />
            ) : (
              <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <p className="flex items-start gap-2 font-medium">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  {detail.message}
                </p>
                {selected && (
                  <Button variant="outline" onClick={() => void loadDetail(selected.id)}>
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Try again
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
