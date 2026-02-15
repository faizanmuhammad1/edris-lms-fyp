"use client";

import { useState, useEffect, useTransition } from "react";
import { adminGetAllTickets } from "@/app/data/support/admin-get-all-tickets";
import { TicketListCard } from "@/components/support/TicketListCard";
import { TicketFilters } from "@/components/support/TicketFilters";
import { Card, CardContent } from "@/components/ui/card";
import {
  Headset,
  Loader2,
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
} from "lucide-react";

interface AdminSupportDashboardProps {
  stats: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    escalatedTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    resolvedToday: number;
    createdToday: number;
    activeTickets: number;
    categoryBreakdown: { category: string; count: number }[];
    priorityBreakdown: { priority: string; count: number }[];
  };
}

const statCards = [
  {
    key: "openTickets",
    label: "Open",
    icon: Inbox,
    className: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    key: "inProgressTickets",
    label: "In Progress",
    icon: Clock,
    className: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    key: "escalatedTickets",
    label: "Escalated",
    icon: AlertTriangle,
    className: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    key: "resolvedToday",
    label: "Resolved Today",
    icon: CheckCircle2,
    className: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
  {
    key: "createdToday",
    label: "Created Today",
    icon: TrendingUp,
    className: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/20",
  },
];

export function AdminSupportDashboard({ stats }: AdminSupportDashboardProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    startTransition(async () => {
      const data = await adminGetAllTickets({
        status: status !== "all" ? status : undefined,
        category: category !== "all" ? category : undefined,
        priority: priority !== "all" ? priority : undefined,
        search: search || undefined,
      });
      setTickets(data);
      setInitialLoad(false);
    });
  }, [search, status, category, priority]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Headset className="h-6 w-6 text-primary" />
          Support Center
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage all support tickets across the platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const value = stats[card.key as keyof typeof stats] as number;
          return (
            <Card key={card.key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.className}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <TicketFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
        showPriority
        priority={priority}
        onPriorityChange={setPriority}
      />

      {/* Ticket List */}
      {initialLoad ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Headset className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No tickets found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {search || status !== "all" || category !== "all" || priority !== "all"
              ? "No tickets match your current filters. Try adjusting them."
              : "There are no support tickets in the system yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} found
          </p>
          {tickets.map((ticket) => (
            <TicketListCard
              key={ticket.id}
              ticket={ticket}
              href={`/admin/support/${ticket.id}`}
              showCreatedBy
            />
          ))}
        </div>
      )}
    </div>
  );
}
