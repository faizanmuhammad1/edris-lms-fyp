"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Headset, PlusCircle, RefreshCw, SearchX } from "lucide-react";
import { getUserTickets } from "@/app/data/support/get-user-tickets";
import { TicketListCard } from "@/components/support/TicketListCard";
import { TicketFilters } from "@/components/support/TicketFilters";
import { EmptyState } from "@/components/general/EmptyState";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "../../_components/DashboardSkeletons";
import { studentCategoryOptions } from "./student-categories";

type Ticket = Awaited<ReturnType<typeof getUserTickets>>[number];

const SEARCH_DEBOUNCE_MS = 300;

export function StudentTicketList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  // Result of the latest finished request, tagged with the query it answers.
  const [result, setResult] = useState<{ key: string; tickets: Ticket[]; error: boolean } | null>(null);
  const requestIdRef = useRef(0);

  // Debounce typing so we don't query on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const queryKey = JSON.stringify([debouncedSearch, status, category, reloadKey]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;
    getUserTickets({
      status: status !== "all" ? status : undefined,
      category: category !== "all" ? category : undefined,
      search: debouncedSearch || undefined,
    })
      .then((data) => {
        // Ignore stale responses from earlier filter values.
        if (isCurrent()) setResult({ key: queryKey, tickets: data, error: false });
      })
      .catch(() => {
        if (isCurrent()) setResult({ key: queryKey, tickets: [], error: true });
      });
  }, [debouncedSearch, status, category, reloadKey, queryKey]);

  const loading = result?.key !== queryKey;
  const error = !loading && !!result?.error;
  const tickets = result?.tickets ?? [];

  const hasFilters = !!debouncedSearch || status !== "all" || category !== "all";

  return (
    <div className="space-y-4">
      <TicketFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
        categoryOptions={studentCategoryOptions}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {loading ? "Loading tickets…" : error ? "" : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} found`}
      </p>

      {loading && (!result || result.error || result.tickets.length === 0) ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">We couldn&apos;t load your tickets.</p>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchX}
            title="No matching tickets"
            description="No tickets match your search or filters. Try different keywords or clear the filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setStatus("all");
                  setCategory("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Headset}
            title="No support tickets yet"
            description="Need help with a course, your account or a payment? Open a ticket and we'll get back to you."
            action={
              <Button asChild size="lg">
                <Link href="/dashboard/support/new">
                  <PlusCircle aria-hidden="true" />
                  Create your first ticket
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <ul className={loading ? "space-y-3 opacity-60 transition-opacity" : "space-y-3"} aria-busy={loading}>
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketListCard ticket={ticket} href={`/dashboard/support/${ticket.id}`} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
