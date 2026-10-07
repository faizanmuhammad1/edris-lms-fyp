"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, FileText, PencilLine } from "lucide-react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Button } from "@/components/ui/button";
import { StudentIdentity } from "@/app/teacher/students/_components/StudentIdentity";
import { formatDate } from "@/app/teacher/_components/format";
import { SubmissionStatusBadge } from "./ProgressBadges";
import type { Submission } from "./progress-utils";

interface SubmissionsTableProps {
  submissions: Submission[];
  onGrade: (submission: Submission) => void;
}

export function formatSubmissionScore(s: Submission) {
  if (s.status !== "Graded" || s.score == null) return "Not graded";
  return s.assignment.maxScore != null ? `${s.score} / ${s.assignment.maxScore}` : String(s.score);
}

const getSearchText = (s: Submission) =>
  `${s.student.name} ${s.student.email} ${s.assignment.title} ${s.course.title} ${s.lesson.title}`;

function GradeButton({ submission, onGrade, className }: { submission: Submission; onGrade: (s: Submission) => void; className?: string }) {
  const graded = submission.status === "Graded";
  return (
    <Button
      variant={graded ? "outline" : "default"}
      size="sm"
      className={className}
      onClick={() => onGrade(submission)}
      aria-label={`${graded ? "Edit grade for" : "Grade"} ${submission.student.name}'s submission to ${submission.assignment.title}`}
    >
      <PencilLine aria-hidden="true" />
      {graded ? "Edit grade" : "Grade"}
    </Button>
  );
}

export function SubmissionsTable({ submissions, onGrade }: SubmissionsTableProps) {
  const [needsGradingOnly, setNeedsGradingOnly] = useState(false);

  const data = useMemo(
    () => (needsGradingOnly ? submissions.filter((s) => s.status === "Submitted") : submissions),
    [submissions, needsGradingOnly]
  );
  const needsGradingCount = useMemo(() => submissions.filter((s) => s.status === "Submitted").length, [submissions]);

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        id: "student",
        accessorFn: (s) => s.student.name.toLowerCase(),
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
        id: "assignment",
        accessorFn: (s) => s.assignment.title.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Assignment" />,
        cell: ({ row }) => (
          <div className="min-w-[10rem] max-w-[18rem] whitespace-normal">
            <p className="line-clamp-2 break-words font-medium">{row.original.assignment.title}</p>
            <p className="line-clamp-1 break-words text-xs text-muted-foreground">
              {row.original.course.title} &middot; {row.original.lesson.title}
            </p>
          </div>
        ),
      },
      {
        id: "submitted",
        accessorFn: (s) => new Date(s.submittedAt).getTime(),
        header: ({ column }) => <SortableHeader column={column} title="Submitted" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.submittedAt)}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => <SubmissionStatusBadge status={row.original.status} />,
      },
      {
        id: "score",
        accessorFn: (s) => s.score ?? -1,
        header: ({ column }) => <SortableHeader column={column} title="Score" />,
        cell: ({ row }) => <span className="tabular-nums">{formatSubmissionScore(row.original)}</span>,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <GradeButton submission={row.original} onGrade={onGrade} />
          </div>
        ),
      },
    ],
    [onGrade]
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      getSearchText={getSearchText}
      searchPlaceholder="Search by student, assignment or course"
      toolbar={
        submissions.length > 0 ? (
          <Button
            variant={needsGradingOnly ? "default" : "outline"}
            aria-pressed={needsGradingOnly}
            onClick={() => setNeedsGradingOnly((v) => !v)}
            className="w-full sm:w-auto"
          >
            <ClipboardCheck aria-hidden="true" />
            Needs grading ({needsGradingCount})
          </Button>
        ) : undefined
      }
      emptyState={
        submissions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assignment submissions yet"
            description="Submissions to the assignments in your lessons appear here, ready to grade."
            buttonText="Go to courses"
            href="/teacher/courses"
          />
        ) : undefined
      }
      noResultsText={
        needsGradingOnly ? "Nothing waiting to be graded matches your search." : "No submissions match your search."
      }
      renderMobileCard={(s) => (
        <article className="space-y-3 rounded-xl border bg-card p-4" aria-label={`${s.student.name}, ${s.assignment.title}`}>
          <StudentIdentity name={s.student.name} email={s.student.email} image={s.student.image} />
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{s.assignment.title}</p>
            <p className="break-words text-xs text-muted-foreground">
              {s.course.title} &middot; {s.lesson.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <SubmissionStatusBadge status={s.status} />
            <span className="tabular-nums">{formatSubmissionScore(s)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Submitted {formatDate(s.submittedAt)}</p>
          <GradeButton submission={s} onGrade={onGrade} className="h-10 w-full" />
        </article>
      )}
      getRowId={(s) => s.id}
      caption="Assignment submissions"
    />
  );
}
