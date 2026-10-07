"use client";

import { CardListSkeleton } from "@/app/teacher/_components/TeacherSkeletons";
import { getTeacherTickets } from "@/app/data/support/get-teacher-tickets";
import { EmptyState } from "@/components/general/EmptyState";
import { TicketFilters } from "@/components/support/TicketFilters";
import { TicketListCard } from "@/components/support/TicketListCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AlertCircle, Inbox, RefreshCw, SearchX, Send, Users, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

type Ticket = Awaited<ReturnType<typeof getTeacherTickets>>[number];
type TicketTab = "assigned" | "student" | "mine";

const TABS: Record<TicketTab, { label: string; icon: LucideIcon; emptyTitle: string; emptyDescription: string }> = {
  assigned: {
    label: "Assigned to me",
    icon: Inbox,
    emptyTitle: "No tickets assigned to you",
    emptyDescription: "Tickets routed to you by students or the admin team will show up here.",
  },
  student: {
    label: "Student tickets",
    icon: Users,
    emptyTitle: "No student tickets",
    emptyDescription: "No students from your courses have raised tickets that are assigned to someone else.",
  },
  mine: {
    label: "My tickets",
    icon: Send,
    emptyTitle: "You haven't created any tickets",
    emptyDescription: "Need help from the platform team with your courses, payouts or account? Open a ticket.",
  },
};

const TAB_KEYS = Object.keys(TABS) as TicketTab[];

/** Teacher support inbox: tabs for assigned, student and own tickets with search and filters. */
export function TeacherSupportTickets() {
  const [tab, setTab] = useState<TicketTab>("assigned");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadCount, setReloadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const latestRequest = useRef(0);

  // Debounce the search box so typing doesn't fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const requestId = ++latestRequest.current;
    startTransition(async () => {
      try {
        const data = await getTeacherTickets({
          tab,
          status: status !== "all" ? status : undefined,
          category: category !== "all" ? category : undefined,
          search: search || undefined,
        });
        // Ignore responses that arrive after a newer request was made
        if (requestId !== latestRequest.current) return;
        setTickets(data);
        setLoadState("ready");
      } catch {
        if (requestId !== latestRequest.current) return;
        setLoadState("error");
      }
    });
  }, [tab, search, status, category, reloadCount]);

  const hasFilters = search !== "" || status !== "all" || category !== "all";
  const current = TABS[tab];

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setCategory("all");
  }

  function renderList() {
    if (loadState === "loading") {
      return <CardListSkeleton count={4} />;
    }

    if (loadState === "error") {
      return (
        <div
          className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center"
          role="alert"
        >
          <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
          <p className="max-w-md text-sm text-muted-foreground">
            We couldn&apos;t load your tickets. Check your connection and try again.
          </p>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => {
              setLoadState("loading");
              setReloadCount((n) => n + 1);
            }}
          >
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        </div>
      );
    }

    if (tickets.length === 0) {
      return hasFilters ? (
        <EmptyState
          icon={SearchX}
          titleAs="h3"
          title="No matching tickets"
          description="No tickets in this list match your search, status and category filters."
          action={
            <Button variant="outline" className="h-10" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={current.icon}
          titleAs="h3"
          title={current.emptyTitle}
          description={current.emptyDescription}
          buttonText={tab === "mine" ? "Create a ticket" : undefined}
          href={tab === "mine" ? "/teacher/support/new" : undefined}
        />
      );
    }

    return (
      <ul className={cn("space-y-2 transition-opacity", isPending && "opacity-60")} aria-busy={isPending}>
        {tickets.map((ticket) => (
          <li key={ticket.id} className="min-w-0">
            <TicketListCard ticket={ticket} href={`/teacher/support/${ticket.id}`} showCreatedBy={tab !== "mine"} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TicketTab)} className="gap-4">
      {/* Scrolls sideways on narrow screens instead of overflowing the page */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList className="h-10 w-max" aria-label="Ticket lists">
          {TAB_KEYS.map((key) => {
            const Icon = TABS[key].icon;
            return (
              <TabsTrigger key={key} value={key} className="flex-none px-3">
                <Icon aria-hidden="true" />
                {TABS[key].label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TicketFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
      />

      {TAB_KEYS.map((key) => (
        <TabsContent key={key} value={key} className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{TABS[key].label}</h2>
            {loadState === "ready" && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {isPending ? "Updating..." : `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`}
              </p>
            )}
          </div>
          {renderList()}
        </TabsContent>
      ))}
    </Tabs>
  );
}

