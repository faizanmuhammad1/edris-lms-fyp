"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, type BadgeTone } from "@/app/admin/_components/StatusBadge";
import { formatCents, formatNumber } from "@/app/admin/_lib/format";
import type { PurchaseDetailRow } from "@/app/data/admin/admin-get-purchase-details";

const STATUS_TONES: Record<string, BadgeTone> = {
  Active: "success",
  Pending: "warning",
  Cancelled: "danger",
};

const STATUS_OPTIONS = ["Active", "Pending", "Cancelled"] as const;

function PurchaseStatus({ status }: { status: string }) {
  return <StatusBadge tone={STATUS_TONES[status] ?? "neutral"}>{status}</StatusBadge>;
}

/** Client-local time; the server may render a different timezone, so hydration differences are expected. */
function PurchaseDate({ value, inline = false }: { value: Date; inline?: boolean }) {
  const date = new Date(value);
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning className="whitespace-nowrap">
      {inline ? (
        format(date, "MMM d, yyyy 'at' h:mm a")
      ) : (
        <>
          <span className="block" suppressHydrationWarning>
            {format(date, "MMM d, yyyy")}
          </span>
          <span className="block text-xs text-muted-foreground" suppressHydrationWarning>
            {format(date, "h:mm a")}
          </span>
        </>
      )}
    </time>
  );
}

function Person({ name, email }: { name: string; email: string }) {
  return (
    <div className="min-w-0 max-w-[14rem]">
      <p className="truncate font-medium">{name}</p>
      <p className="truncate text-xs text-muted-foreground">{email}</p>
    </div>
  );
}

const columns: ColumnDef<PurchaseDetailRow>[] = [
  {
    id: "date",
    accessorFn: (row) => new Date(row.createdAt).getTime(),
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => <PurchaseDate value={row.original.createdAt} />,
  },
  {
    id: "student",
    accessorFn: (row) => row.studentName,
    header: ({ column }) => <SortableHeader column={column} title="Purchased by" />,
    cell: ({ row }) => <Person name={row.original.studentName} email={row.original.studentEmail} />,
  },
  {
    id: "course",
    accessorFn: (row) => row.courseTitle,
    header: ({ column }) => <SortableHeader column={column} title="Course" />,
    cell: ({ row }) => (
      <p className="max-w-[16rem] truncate" title={row.original.courseTitle}>
        {row.original.courseTitle}
      </p>
    ),
  },
  {
    id: "teacher",
    accessorFn: (row) => row.teacherName,
    header: "Teacher",
    enableSorting: false,
    cell: ({ row }) => <Person name={row.original.teacherName} email={row.original.teacherEmail} />,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-medium tabular-nums">{formatCents(row.original.amount)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <PurchaseStatus status={row.original.status} />,
  },
];

function PurchaseCard({ row }: { row: PurchaseDetailRow }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 min-w-0 break-words font-medium">{row.courseTitle}</p>
        <span className="shrink-0 font-semibold tabular-nums">{formatCents(row.amount)}</span>
      </div>
      <dl className="space-y-1.5 text-sm">
        <div className="flex min-w-0 gap-2">
          <dt className="w-16 shrink-0 text-muted-foreground">Student</dt>
          <dd className="min-w-0">
            <span className="block truncate">{row.studentName}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.studentEmail}</span>
          </dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="w-16 shrink-0 text-muted-foreground">Teacher</dt>
          <dd className="min-w-0 truncate">{row.teacherName}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <PurchaseDate value={row.createdAt} inline />
        <PurchaseStatus status={row.status} />
      </div>
    </div>
  );
}

interface PurchaseDetailTableProps {
  data: PurchaseDetailRow[];
  /** How many rows the query was capped at, to tell admins when older purchases are hidden. */
  limit: number;
}

export function PurchaseDetailTable({ data, limit }: PurchaseDetailTableProps) {
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(
    () => (status === "all" ? data : data.filter((row) => row.status === status)),
    [data, status]
  );

  return (
    <div className="space-y-3">
      {data.length >= limit && (
        <p className="text-sm text-muted-foreground">
          Showing the {formatNumber(limit)} most recent purchases.
        </p>
      )}
      <DataTable
        columns={columns}
        data={filtered}
        caption="Purchase history, newest first"
        getRowId={(row) => row.id}
        pageSize={15}
        getSearchText={(row) =>
          `${row.studentName} ${row.studentEmail} ${row.courseTitle} ${row.teacherName} ${row.teacherEmail}`
        }
        searchPlaceholder="Search student, email, course or teacher"
        noResultsText={
          status === "all" ? "No purchases match your search." : `No ${status.toLowerCase()} purchases match your filters.`
        }
        renderMobileCard={(row) => <PurchaseCard row={row} />}
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter purchases by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyState={
          // Only when there are no purchases at all; an empty filter result keeps the toolbar visible.
          status === "all" ? (
            <EmptyState
              titleAs="h3"
              icon={Receipt}
              title="No purchases yet"
              description="Every enrollment (who bought which course, from which teacher, and when) will be listed here."
            />
          ) : undefined
        }
      />
    </div>
  );
}
