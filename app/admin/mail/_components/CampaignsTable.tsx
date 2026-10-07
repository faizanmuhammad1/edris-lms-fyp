"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Mail, Pencil, RotateCw } from "lucide-react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/app/admin/_lib/format";
import { CAMPAIGN_STATUS_META, type CampaignStatus } from "../_lib/campaign";
import { CampaignStatusBadge } from "./CampaignStatusBadge";

export type CampaignRow = {
  id: string;
  subject: string;
  status: CampaignStatus;
  /** Who it targets, e.g. "Students of Intro to React". */
  audience: string;
  /** Recipients who have received it so far. */
  recipientCount: number;
  /** Sent date for sent campaigns, last change otherwise (epoch ms, for sorting). */
  dateValue: number;
  dateIso: string;
  /** Pre-formatted on the server so SSR and hydration agree. */
  dateLabel: string;
};

type StatusFilter = "all" | CampaignStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: CAMPAIGN_STATUS_META.draft.label },
  { value: "sent", label: CAMPAIGN_STATUS_META.sent.label },
  { value: "partial", label: CAMPAIGN_STATUS_META.partial.label },
];

const DATE_KIND: Record<CampaignStatus, string> = {
  draft: "Last edited",
  partial: "Last send attempt",
  sent: "Sent",
};

function subjectText(row: CampaignRow) {
  return row.subject.trim() || "(No subject)";
}

const ROW_ACTIONS: Record<
  CampaignStatus,
  { label: string; ariaPrefix: string; icon: typeof Pencil; hash: string; variant: "ghost" | "outline" }
> = {
  draft: { label: "Edit", ariaPrefix: "Edit campaign", icon: Pencil, hash: "", variant: "ghost" },
  sent: { label: "View", ariaPrefix: "View campaign", icon: Eye, hash: "", variant: "ghost" },
  // Opens the campaign at its send panel, where the resend is confirmed.
  partial: {
    label: "Retry unsent",
    ariaPrefix: "Retry unsent recipients for campaign",
    icon: RotateCw,
    hash: "#send",
    variant: "outline",
  },
};

function RowAction({ row, fullWidth = false }: { row: CampaignRow; fullWidth?: boolean }) {
  const action = ROW_ACTIONS[row.status];
  const Icon = action.icon;

  return (
    <Button asChild variant={action.variant} className={fullWidth ? "w-full" : undefined}>
      <Link
        href={`/admin/mail/compose/${row.id}${action.hash}`}
        aria-label={`${action.ariaPrefix}: ${subjectText(row)}`}
      >
        <Icon aria-hidden="true" />
        {action.label}
      </Link>
    </Button>
  );
}

function RecipientsText({ row }: { row: CampaignRow }) {
  if (row.status === "draft") {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not sent yet</span>
      </span>
    );
  }
  if (row.status === "partial") {
    return <span className="tabular-nums">{formatNumber(row.recipientCount)} so far</span>;
  }
  return <span className="tabular-nums">{formatNumber(row.recipientCount)}</span>;
}

const columns: ColumnDef<CampaignRow>[] = [
  {
    accessorKey: "subject",
    header: "Campaign",
    cell: ({ row }) => (
      <div className="min-w-[12rem] max-w-md whitespace-normal">
        <p className="font-medium break-words line-clamp-2">{subjectText(row.original)}</p>
        <p className="text-sm text-muted-foreground break-words">{row.original.audience}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <CampaignStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "recipientCount",
    header: ({ column }) => <SortableHeader column={column} title="Recipients" />,
    cell: ({ row }) => <RecipientsText row={row.original} />,
  },
  {
    id: "date",
    accessorFn: (row) => row.dateValue,
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <time dateTime={row.original.dateIso}>{row.original.dateLabel}</time>
        <span className="block text-xs text-muted-foreground">{DATE_KIND[row.original.status]}</span>
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowAction row={row.original} />
      </div>
    ),
  },
];

function CampaignCard({ row }: { row: CampaignRow }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium break-words">{subjectText(row)}</p>
          <p className="text-sm text-muted-foreground break-words">{row.audience}</p>
        </div>
        <div className="shrink-0">
          <CampaignStatusBadge status={row.status} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Recipients</dt>
          <dd>
            <RecipientsText row={row} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{DATE_KIND[row.status]}</dt>
          <dd>
            <time dateTime={row.dateIso}>{row.dateLabel}</time>
          </dd>
        </div>
      </dl>
      <RowAction row={row} fullWidth />
    </div>
  );
}

export function CampaignsTable({ campaigns }: { campaigns: CampaignRow[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: campaigns.length, draft: 0, sent: 0, partial: 0 };
    for (const c of campaigns) result[c.status] += 1;
    return result;
  }, [campaigns]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? campaigns : campaigns.filter((c) => c.status === statusFilter)),
    [campaigns, statusFilter]
  );

  if (campaigns.length === 0) {
    return (
      <EmptyState
        titleAs="h3"
        icon={Mail}
        title="No campaigns yet"
        description="Create a campaign to email newsletter subscribers, students or teachers."
        buttonText="New campaign"
        href="/admin/mail/compose"
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={filtered}
      getRowId={(row) => row.id}
      getSearchText={(row) => `${row.subject} ${row.audience}`}
      searchPlaceholder="Search campaigns by subject"
      noResultsText={
        statusFilter === "all"
          ? "No campaigns match your search."
          : `No ${CAMPAIGN_STATUS_META[statusFilter].label.toLowerCase()} campaigns match.`
      }
      caption="Mail campaigns, most recently updated first"
      renderMobileCard={(row) => <CampaignCard row={row} />}
      toolbar={
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter campaigns by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label} ({formatNumber(counts[f.value])})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}
