"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, Eye, ShieldAlert } from "lucide-react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Button } from "@/components/ui/button";
import { StudentIdentity } from "@/app/teacher/students/_components/StudentIdentity";
import { formatDate } from "@/app/teacher/_components/format";
import { IntegrityBadge, PassBadge } from "./ProgressBadges";
import { attemptDate, formatDuration, getTotalViolations, type QuizAttempt } from "./progress-utils";

interface QuizAttemptsTableProps {
  attempts: QuizAttempt[];
  onView: (attempt: QuizAttempt) => void;
}

const getSearchText = (a: QuizAttempt) =>
  `${a.student.name} ${a.student.email} ${a.quiz.title} ${a.course.title} ${a.lesson.title}`;

function ViewButton({ attempt, onView, className }: { attempt: QuizAttempt; onView: (a: QuizAttempt) => void; className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => onView(attempt)}
      aria-label={`View attempt by ${attempt.student.name} on ${attempt.quiz.title}`}
    >
      <Eye aria-hidden="true" />
      View
    </Button>
  );
}

export function QuizAttemptsTable({ attempts, onView }: QuizAttemptsTableProps) {
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const data = useMemo(
    () => (flaggedOnly ? attempts.filter((a) => getTotalViolations(a) > 0) : attempts),
    [attempts, flaggedOnly]
  );

  const columns = useMemo<ColumnDef<QuizAttempt>[]>(
    () => [
      {
        id: "student",
        accessorFn: (a) => a.student.name.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Student" />,
        cell: ({ row }) => (
          <StudentIdentity
            name={row.original.student.name}
            email={row.original.student.email}
            image={row.original.student.image}
            className="max-w-[14rem]"
          />
        ),
      },
      {
        id: "quiz",
        accessorFn: (a) => a.quiz.title.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Quiz" />,
        cell: ({ row }) => (
          <div className="min-w-[10rem] max-w-[16rem] whitespace-normal">
            <p className="line-clamp-2 break-words font-medium">{row.original.quiz.title}</p>
            <p className="line-clamp-1 break-words text-xs text-muted-foreground" title={row.original.course.title}>
              {row.original.course.title}
            </p>
          </div>
        ),
      },
      {
        id: "score",
        accessorFn: (a) => a.score,
        header: ({ column }) => <SortableHeader column={column} title="Score" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="w-10 text-sm font-semibold tabular-nums">{row.original.score}%</span>
            <PassBadge passed={row.original.passed} />
          </div>
        ),
      },
      {
        id: "integrity",
        accessorFn: (a) => getTotalViolations(a),
        header: ({ column }) => <SortableHeader column={column} title="Integrity" />,
        cell: ({ row }) => <IntegrityBadge total={getTotalViolations(row.original)} />,
      },
      {
        id: "time",
        accessorFn: (a) => a.timeSpent,
        header: ({ column }) => <SortableHeader column={column} title="Time" />,
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatDuration(row.original.timeSpent)}</span>,
      },
      {
        id: "submitted",
        accessorFn: (a) => attemptDate(a).getTime(),
        header: ({ column }) => <SortableHeader column={column} title="Submitted" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(attemptDate(row.original))}</span>,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ViewButton attempt={row.original} onView={onView} />
          </div>
        ),
      },
    ],
    [onView]
  );

  const flaggedCount = useMemo(() => attempts.filter((a) => getTotalViolations(a) > 0).length, [attempts]);

  return (
    <DataTable
      columns={columns}
      data={data}
      getSearchText={getSearchText}
      searchPlaceholder="Search by student, quiz or course"
      toolbar={
        attempts.length > 0 ? (
          <Button
            variant={flaggedOnly ? "default" : "outline"}
            aria-pressed={flaggedOnly}
            onClick={() => setFlaggedOnly((v) => !v)}
            className="w-full sm:w-auto"
          >
            <ShieldAlert aria-hidden="true" />
            Flagged only ({flaggedCount})
          </Button>
        ) : undefined
      }
      emptyState={
        attempts.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No quiz attempts yet"
            description="When students take the quizzes in your lessons, their scores and integrity reports appear here."
            buttonText="Manage quizzes"
            href="/teacher/quizzes"
          />
        ) : undefined
      }
      noResultsText={flaggedOnly ? "No flagged attempts match your search." : "No quiz attempts match your search."}
      renderMobileCard={(a) => (
        <article className="space-y-3 rounded-xl border bg-card p-4" aria-label={`${a.student.name}, ${a.quiz.title}`}>
          <StudentIdentity name={a.student.name} email={a.student.email} image={a.student.image} />
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{a.quiz.title}</p>
            <p className="break-words text-xs text-muted-foreground">{a.course.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{a.score}%</span>
            <PassBadge passed={a.passed} />
            <IntegrityBadge total={getTotalViolations(a)} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(attemptDate(a))} &middot; {formatDuration(a.timeSpent)} spent
          </p>
          <ViewButton attempt={a} onView={onView} className="h-10 w-full" />
        </article>
      )}
      getRowId={(a) => a.id}
      caption="Quiz attempts"
    />
  );
}
