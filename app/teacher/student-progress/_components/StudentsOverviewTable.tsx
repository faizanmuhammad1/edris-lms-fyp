"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChartLine, Eye } from "lucide-react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Button } from "@/components/ui/button";
import { StudentIdentity } from "@/app/teacher/students/_components/StudentIdentity";
import { formatDate } from "@/app/teacher/_components/format";
import { ScoreBar } from "./ProgressBadges";
import type { StudentSummary } from "./progress-utils";

interface StudentsOverviewTableProps {
  students: StudentSummary[];
  onView: (student: StudentSummary) => void;
}

const getSearchText = (s: StudentSummary) => `${s.name} ${s.email} ${s.courses.join(" ")}`;

function AverageScore({ student }: { student: StudentSummary }) {
  if (student.averageScore == null) {
    return <span className="text-sm text-muted-foreground">No quizzes taken</span>;
  }
  return <ScoreBar value={student.averageScore} label={`${student.name}'s average quiz score`} />;
}

function quizSummary(s: StudentSummary) {
  return s.attempts.length > 0 ? `${s.passedCount} of ${s.attempts.length} passed` : "None";
}

function assignmentSummary(s: StudentSummary) {
  if (s.submissions.length === 0) return "None";
  return s.needsGrading > 0
    ? `${s.submissions.length} submitted, ${s.needsGrading} to grade`
    : `${s.submissions.length} submitted, all graded`;
}

function ViewButton({ student, onView, className }: { student: StudentSummary; onView: (s: StudentSummary) => void; className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => onView(student)}
      aria-label={`View progress for ${student.name}`}
    >
      <Eye aria-hidden="true" />
      Details
    </Button>
  );
}

export function StudentsOverviewTable({ students, onView }: StudentsOverviewTableProps) {
  const columns = useMemo<ColumnDef<StudentSummary>[]>(
    () => [
      {
        id: "student",
        accessorFn: (s) => s.name.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Student" />,
        cell: ({ row }) => (
          <StudentIdentity
            name={row.original.name}
            email={row.original.email}
            image={row.original.image}
            className="max-w-[14rem]"
          />
        ),
      },
      {
        id: "courses",
        accessorFn: (s) => s.courses.length,
        header: ({ column }) => <SortableHeader column={column} title="Courses" />,
        cell: ({ row }) => {
          const courses = row.original.courses;
          return (
            <p className="line-clamp-2 min-w-[8rem] max-w-[14rem] whitespace-normal break-words text-sm" title={courses.join(", ")}>
              {courses.join(", ")}
            </p>
          );
        },
      },
      {
        id: "average",
        accessorFn: (s) => s.averageScore ?? -1,
        header: ({ column }) => <SortableHeader column={column} title="Avg. quiz score" />,
        cell: ({ row }) => <AverageScore student={row.original} />,
      },
      {
        id: "quizzes",
        accessorFn: (s) => s.attempts.length,
        header: ({ column }) => <SortableHeader column={column} title="Quizzes" />,
        cell: ({ row }) => <span className="text-sm">{quizSummary(row.original)}</span>,
      },
      {
        id: "assignments",
        accessorFn: (s) => s.needsGrading,
        header: ({ column }) => <SortableHeader column={column} title="Assignments" />,
        cell: ({ row }) => <span className="text-sm">{assignmentSummary(row.original)}</span>,
      },
      {
        accessorKey: "lastActivity",
        header: ({ column }) => <SortableHeader column={column} title="Last active" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.lastActivity)}</span>,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ViewButton student={row.original} onView={onView} />
          </div>
        ),
      },
    ],
    [onView]
  );

  return (
    <DataTable
      columns={columns}
      data={students}
      getSearchText={getSearchText}
      searchPlaceholder="Search by name, email or course"
      emptyState={
        <EmptyState
          icon={ChartLine}
          title="No student activity yet"
          description="Once students take quizzes or submit assignments in your courses, their progress shows up here."
          buttonText="Go to courses"
          href="/teacher/courses"
        />
      }
      noResultsText="No students match your search."
      renderMobileCard={(s) => (
        <article className="space-y-3 rounded-xl border bg-card p-4" aria-label={s.name}>
          <StudentIdentity name={s.name} email={s.email} image={s.image} />
          <p className="break-words text-xs text-muted-foreground">{s.courses.join(", ")}</p>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Average quiz score</p>
            <AverageScore student={s} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Quizzes</dt>
              <dd>{quizSummary(s)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Assignments</dt>
              <dd>{assignmentSummary(s)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Last active</dt>
              <dd>{formatDate(s.lastActivity)}</dd>
            </div>
          </dl>
          <ViewButton student={s} onView={onView} className="h-10 w-full" />
        </article>
      )}
      getRowId={(s) => s.id}
      caption="Student progress"
    />
  );
}
