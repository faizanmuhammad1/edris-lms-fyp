"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GraduationCap } from "lucide-react";
import { useMemo } from "react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { formatCents, formatNumber, pluralize } from "@/app/admin/_lib/format";
import type { TeacherPerformanceRow } from "@/app/data/admin/admin-get-analytics-extended";
import { RankBadge } from "./RankBadge";

type RankedTeacher = TeacherPerformanceRow & { rank: number };

function BestSeller({ row }: { row: RankedTeacher }) {
  return (
    <div className="min-w-0 max-w-[16rem]">
      <p className="truncate" title={row.topCourseTitle}>
        {row.topCourseTitle}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatCents(row.topCourseRevenue)} · {pluralize(row.topCourseEnrollments, "enrollment")}
      </p>
    </div>
  );
}

const columns: ColumnDef<RankedTeacher>[] = [
  {
    accessorKey: "rank",
    header: ({ column }) => <SortableHeader column={column} title="Rank" />,
    cell: ({ row }) => <RankBadge rank={row.original.rank} />,
  },
  {
    id: "teacher",
    accessorFn: (row) => row.teacherName,
    header: ({ column }) => <SortableHeader column={column} title="Teacher" />,
    cell: ({ row }) => (
      <div className="min-w-0 max-w-[16rem]">
        <p className="truncate font-medium">{row.original.teacherName}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.teacherEmail}</p>
      </div>
    ),
  },
  {
    accessorKey: "totalRevenue",
    header: ({ column }) => <SortableHeader column={column} title="Revenue" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatCents(row.original.totalRevenue)}</span>,
  },
  {
    accessorKey: "enrollmentCount",
    header: ({ column }) => <SortableHeader column={column} title="Enrollments" />,
    cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.enrollmentCount)}</span>,
  },
  {
    accessorKey: "courseCount",
    header: ({ column }) => <SortableHeader column={column} title="Courses with sales" />,
    cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.courseCount)}</span>,
  },
  {
    id: "topCourse",
    header: "Best-selling course",
    enableSorting: false,
    cell: ({ row }) => <BestSeller row={row.original} />,
  },
];

function TeacherCard({ row }: { row: RankedTeacher }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <RankBadge rank={row.rank} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{row.teacherName}</p>
          <p className="truncate text-xs text-muted-foreground">{row.teacherEmail}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm min-[400px]:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Revenue</dt>
          <dd className="font-medium tabular-nums">{formatCents(row.totalRevenue)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Enrollments</dt>
          <dd className="tabular-nums">{formatNumber(row.enrollmentCount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Courses with sales</dt>
          <dd className="tabular-nums">{formatNumber(row.courseCount)}</dd>
        </div>
      </dl>
      <div className="border-t pt-3 text-sm">
        <p className="text-xs text-muted-foreground">Best-selling course</p>
        <p className="line-clamp-2 break-words">{row.topCourseTitle}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatCents(row.topCourseRevenue)} · {pluralize(row.topCourseEnrollments, "enrollment")}
        </p>
      </div>
    </div>
  );
}

export function TeacherPerformanceTable({ data }: { data: TeacherPerformanceRow[] }) {
  // Rows arrive sorted by revenue, so the index is the revenue rank.
  const rows = useMemo(() => data.map((row, index) => ({ ...row, rank: index + 1 })), [data]);

  return (
    <DataTable
      columns={columns}
      data={rows}
      caption="Teacher performance, ranked by revenue"
      getRowId={(row) => row.teacherId}
      getSearchText={(row) => `${row.teacherName} ${row.teacherEmail} ${row.topCourseTitle}`}
      searchPlaceholder="Search teachers or courses"
      noResultsText="No teachers match your search."
      renderMobileCard={(row) => <TeacherCard row={row} />}
      emptyState={
        <EmptyState
          titleAs="h3"
          icon={GraduationCap}
          title="No teacher sales yet"
          description="Revenue and enrollments per teacher will appear here once students enroll in their courses."
        />
      }
    />
  );
}
