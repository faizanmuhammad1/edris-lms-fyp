"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { formatCents, formatNumber, pluralize } from "@/app/admin/_lib/format";
import type { TopCourseRow } from "@/app/data/admin/admin-get-analytics-extended";
import { RankBadge } from "./RankBadge";

type RankedCourse = TopCourseRow & { rank: number };

function CourseLink({ row, className }: { row: RankedCourse; className?: string }) {
  return (
    <Link
      href={`/admin/courses/${row.courseId}/edit`}
      className={className ?? "block truncate font-medium hover:underline"}
      title={row.courseTitle}
    >
      {row.courseTitle}
    </Link>
  );
}

const columns: ColumnDef<RankedCourse>[] = [
  {
    accessorKey: "rank",
    header: "#",
    enableSorting: false,
    cell: ({ row }) => <RankBadge rank={row.original.rank} />,
  },
  {
    id: "course",
    accessorFn: (row) => row.courseTitle,
    header: "Course",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0 max-w-[10rem] lg:max-w-[18rem] xl:max-w-[11rem] 2xl:max-w-[20rem]">
        <CourseLink row={row.original} />
        <p className="truncate text-xs text-muted-foreground">{row.original.teacherName}</p>
      </div>
    ),
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => <SortableHeader column={column} title="Revenue" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatCents(row.original.revenue)}</span>,
  },
  {
    accessorKey: "enrollmentCount",
    header: ({ column }) => <SortableHeader column={column} title="Enrollments" />,
    cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.enrollmentCount)}</span>,
  },
];

function CourseCard({ row }: { row: RankedCourse }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <RankBadge rank={row.rank} />
      <div className="min-w-0 flex-1 space-y-1">
        <CourseLink row={row} className="line-clamp-2 break-words font-medium hover:underline" />
        <p className="truncate text-xs text-muted-foreground">{row.teacherName}</p>
        <p className="text-sm tabular-nums">
          <span className="font-medium">{formatCents(row.revenue)}</span>
          <span className="text-muted-foreground"> · {pluralize(row.enrollmentCount, "enrollment")}</span>
        </p>
      </div>
    </div>
  );
}

interface TopCoursesTableProps {
  /** Rendered as the h3 for this list. */
  title: string;
  description: string;
  /** Rows already sorted by the ranking metric (best first). */
  data: TopCourseRow[];
}

export function TopCoursesTable({ title, description, data }: TopCoursesTableProps) {
  const rows = useMemo(() => data.map((row, index) => ({ ...row, rank: index + 1 })), [data]);

  return (
    <div className="min-w-0 space-y-3">
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        pageSize={5}
        caption={`${title}: ${description}`}
        getRowId={(row) => row.courseId}
        renderMobileCard={(row) => <CourseCard row={row} />}
        noResultsText="No course sales yet."
      />
    </div>
  );
}
