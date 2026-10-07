"use client";

import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ColumnDef } from "@tanstack/react-table";
import { BookOpen, Receipt } from "lucide-react";
import { formatCoursePrice, formatMoney, initials } from "../../_components/format";

export interface CoursePerformanceRow {
  title: string;
  students: number;
  price: number;
  revenue: number;
}

const courseColumns: ColumnDef<CoursePerformanceRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} title="Course" />,
    cell: ({ row }) => <span className="block max-w-xs break-words font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: "students",
    header: ({ column }) => <SortableHeader column={column} title="Active students" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.students}</span>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <SortableHeader column={column} title="Price" />,
    cell: ({ row }) => <span className="tabular-nums">{formatCoursePrice(row.original.price)}</span>,
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => <SortableHeader column={column} title="Revenue" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.revenue)}</span>,
  },
];

export function CoursePerformanceTable({ data }: { data: CoursePerformanceRow[] }) {
  return (
    <DataTable
      columns={courseColumns}
      data={data}
      caption="Course performance"
      getSearchText={(row) => row.title}
      searchPlaceholder="Search courses"
      noResultsText="No courses match your search."
      pageSize={8}
      emptyState={
        <EmptyState
          titleAs="h3"
          icon={BookOpen}
          title="No courses yet"
          description="Performance figures appear here once you create a course and students enroll."
          buttonText="Create course"
          href="/teacher/courses/create"
        />
      }
      renderMobileCard={(row) => (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="break-words font-medium">{row.title}</p>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Students</dt>
              <dd className="font-medium tabular-nums">{row.students}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Price</dt>
              <dd className="font-medium tabular-nums">{formatCoursePrice(row.price)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Revenue</dt>
              <dd className="font-medium tabular-nums">{formatMoney(row.revenue)}</dd>
            </div>
          </dl>
        </div>
      )}
    />
  );
}

export interface TransactionRow {
  id: string;
  studentName: string;
  studentEmail: string;
  studentImage: string | null;
  courseTitle: string;
  amount: number;
  /** Epoch ms, for sorting. */
  timestamp: number;
  /** Pre-formatted on the server so hydration matches. */
  dateLabel: string;
}

function StudentCell({ row }: { row: TransactionRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={row.studentImage ?? undefined} alt="" />
        <AvatarFallback className="text-xs">{initials(row.studentName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={row.studentName}>
          {row.studentName}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={row.studentEmail}>
          {row.studentEmail}
        </p>
      </div>
    </div>
  );
}

const transactionColumns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "studentName",
    header: ({ column }) => <SortableHeader column={column} title="Student" />,
    cell: ({ row }) => <StudentCell row={row.original} />,
  },
  {
    accessorKey: "courseTitle",
    header: ({ column }) => <SortableHeader column={column} title="Course" />,
    cell: ({ row }) => <span className="block max-w-xs break-words">{row.original.courseTitle}</span>,
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.dateLabel}</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} title="Amount" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.amount)}</span>,
  },
];

export function TransactionsTable({ data }: { data: TransactionRow[] }) {
  return (
    <DataTable
      columns={transactionColumns}
      data={data}
      caption="Transaction history"
      getRowId={(row) => row.id}
      getSearchText={(row) => `${row.studentName} ${row.studentEmail} ${row.courseTitle}`}
      searchPlaceholder="Search by student or course"
      noResultsText="No transactions match your search."
      emptyState={
        <EmptyState
          titleAs="h3"
          icon={Receipt}
          title="No transactions yet"
          description="Paid enrollments in your courses will be listed here."
        />
      }
      renderMobileCard={(row) => (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <StudentCell row={row} />
          <p className="break-words text-sm">{row.courseTitle}</p>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{row.dateLabel}</span>
            <span className="font-semibold tabular-nums">{formatMoney(row.amount)}</span>
          </div>
        </div>
      )}
    />
  );
}
