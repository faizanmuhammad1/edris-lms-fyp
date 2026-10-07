"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Headset, Loader2, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { getInitials, pluralize } from "@/app/admin/_lib/format";
import { adminGetAllTickets } from "@/app/data/support/admin-get-all-tickets";
import {
  ticketCategoryOptions,
  ticketPriorityOptions,
  ticketStatusOptions,
} from "@/app/data/support/schemas";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { TicketCategoryBadge } from "@/components/support/TicketCategoryBadge";
import { TicketListCard } from "@/components/support/TicketListCard";
import { TicketPriorityBadge } from "@/components/support/TicketPriorityBadge";
import { TicketStatusBadge } from "@/components/support/TicketStatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Ticket = Awaited<ReturnType<typeof adminGetAllTickets>>[number];

/** Labelled filter dropdown with an "all" option. */
function FilterSelect({
  id,
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const PRIORITY_RANK: Record<string, number> = { Low: 0, Medium: 1, High: 2, Urgent: 3 };
const STATUS_RANK: Record<string, number> = { Open: 0, InProgress: 1, Escalated: 2, Resolved: 3, Closed: 4 };

const ticketHref = (ticket: Ticket) => `/admin/support/${ticket.id}`;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: ({ column }) => <SortableHeader column={column} title="Ticket" />,
    cell: ({ row }) => {
      const ticket = row.original;
      return (
        <div className="min-w-48 max-w-80 space-y-1 whitespace-normal">
          <Link
            href={ticketHref(ticket)}
            className="line-clamp-2 font-medium [overflow-wrap:anywhere] hover:text-primary hover:underline"
          >
            {ticket.subject}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
            <TicketCategoryBadge category={ticket.category} />
          </div>
        </div>
      );
    },
  },
  {
    id: "requester",
    accessorFn: (ticket) => ticket.createdBy?.name ?? "",
    header: ({ column }) => <SortableHeader column={column} title="Requester" />,
    cell: ({ row }) => {
      const requester = row.original.createdBy;
      if (!requester) return <span className="text-muted-foreground">Unknown</span>;
      return (
        <div className="flex min-w-36 items-center gap-2">
          <Avatar className="size-7">
            <AvatarImage src={requester.image ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">{getInitials(requester.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="max-w-40 truncate text-sm">{requester.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{requester.role ?? "student"}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    sortingFn: (a, b) => (STATUS_RANK[a.original.status] ?? 99) - (STATUS_RANK[b.original.status] ?? 99),
    cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <SortableHeader column={column} title="Priority" />,
    sortingFn: (a, b) => (PRIORITY_RANK[a.original.priority] ?? -1) - (PRIORITY_RANK[b.original.priority] ?? -1),
    cell: ({ row }) => <TicketPriorityBadge priority={row.original.priority} />,
  },
  {
    id: "assignee",
    accessorFn: (ticket) => ticket.assignedTo?.name ?? "",
    header: "Assigned to",
    cell: ({ row }) =>
      row.original.assignedTo ? (
        <span className="block max-w-36 truncate text-sm">{row.original.assignedTo.name}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Unassigned</span>
      ),
  },
  {
    id: "messages",
    accessorFn: (ticket) => ticket._count.messages,
    header: ({ column }) => <SortableHeader column={column} title="Messages" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original._count.messages}</span>,
  },
  {
    id: "updatedAt",
    accessorFn: (ticket) => new Date(ticket.updatedAt).getTime(),
    header: ({ column }) => <SortableHeader column={column} title="Updated" />,
    cell: ({ row }) => {
      const updated = new Date(row.original.updatedAt);
      return (
        <time dateTime={updated.toISOString()} className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDistanceToNow(updated, { addSuffix: true })}
        </time>
      );
    },
  },
];

interface AdminSupportDashboardProps {
  /** First page of results, rendered on the server so the list shows without a client fetch. */
  initialTickets: Ticket[];
}

/** Ticket list with server-side filters, a sortable table and card layout on phones. */
export function AdminSupportDashboard({ initialTickets }: AdminSupportDashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const latestRequest = useRef(0);
  const isFirstRun = useRef(true);

  const hasFilters = search.trim() !== "" || status !== "all" || category !== "all" || priority !== "all";

  useEffect(() => {
    // The initial (unfiltered) list comes from the server.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const requestId = ++latestRequest.current;
    startTransition(async () => {
      try {
        const data = await adminGetAllTickets({
          status: status !== "all" ? status : undefined,
          category: category !== "all" ? category : undefined,
          priority: priority !== "all" ? priority : undefined,
          search: debouncedSearch || undefined,
        });
        // Ignore responses that arrive after a newer request was made.
        if (requestId !== latestRequest.current) return;
        setTickets(data);
        setError(null);
      } catch {
        if (requestId !== latestRequest.current) return;
        setError("Couldn't load tickets. Check your connection and try again.");
      }
    });
  }, [debouncedSearch, status, category, priority, reloadCount]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setCategory("all");
    setPriority("all");
  }

  const emptyState = hasFilters ? (
        <EmptyState
          icon={SearchX}
          titleAs="h3"
          title="No tickets match your filters"
          description="Try a different search term or clear the filters to see every ticket."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Headset}
          titleAs="h3"
          title="No support tickets yet"
          description="When students or teachers ask for help, their tickets will appear here."
        />
      );

  return (
    <section aria-labelledby="tickets-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tickets-heading" className="text-lg font-semibold">
          Tickets
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Updating results…
            </>
          ) : (
            `${pluralize(tickets.length, "ticket")}${hasFilters ? " match your filters" : ""}`
          )}
        </p>
      </div>

      <div role="search" aria-label="Filter tickets" className="space-y-2">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11rem))]">
          <div className="min-w-0 space-y-1.5 sm:col-span-3 xl:col-span-1">
            <Label htmlFor="ticket-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="ticket-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Subject, ticket number or requester"
                className="pl-9"
              />
            </div>
          </div>
          <FilterSelect
            id="ticket-status-filter"
            label="Status"
            value={status}
            onChange={setStatus}
            allLabel="All statuses"
            options={ticketStatusOptions}
          />
          <FilterSelect
            id="ticket-category-filter"
            label="Category"
            value={category}
            onChange={setCategory}
            allLabel="All categories"
            options={ticketCategoryOptions}
          />
          <FilterSelect
            id="ticket-priority-filter"
            label="Priority"
            value={priority}
            onChange={setPriority}
            allLabel="All priorities"
            options={ticketPriorityOptions}
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground" onClick={clearFilters}>
            Clear all filters
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
          <Button variant="outline" onClick={() => setReloadCount((n) => n + 1)} disabled={isPending}>
            Try again
          </Button>
        </div>
      )}

      <div aria-busy={isPending} className={cn("transition-opacity", isPending && "opacity-60")}>
        <DataTable
          columns={columns}
          data={tickets}
          getRowId={(ticket) => ticket.id}
          caption="Support tickets"
          pageSize={15}
          emptyState={emptyState}
          renderMobileCard={(ticket) => <TicketListCard ticket={ticket} href={ticketHref(ticket)} showCreatedBy />}
        />
      </div>
    </section>
  );
}
