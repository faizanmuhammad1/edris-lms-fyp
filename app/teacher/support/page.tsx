"use client";

import { useState, useEffect, useTransition } from "react";
import { getTeacherTickets } from "@/app/data/support/get-teacher-tickets";
import { TicketListCard } from "@/components/support/TicketListCard";
import { TicketFilters } from "@/components/support/TicketFilters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Headset, Loader2, Inbox, Send, User } from "lucide-react";
import Link from "next/link";

// ... (imports)

type Ticket = Awaited<ReturnType<typeof getTeacherTickets>>[number];

export default function TeacherSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [tab, setTab] = useState<"assigned" | "student" | "mine">("assigned");
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    startTransition(async () => {
      const data = await getTeacherTickets({
        tab,
        status: status !== "all" ? status : undefined,
        category: category !== "all" ? category : undefined,
        search: search || undefined,
      });
      setTickets(data);
      setInitialLoad(false);
    });
  }, [search, status, category, tab]);

  const tabInfo = {
    assigned: {
      label: "Assigned to Me",
      icon: Inbox,
      emptyTitle: "No assigned tickets",
      emptyDesc:
        "You don't have any tickets assigned to you right now.",
    },
    student: {
      label: "Student Tickets",
      icon: User,
      emptyTitle: "No student tickets",
      emptyDesc:
        "No students from your courses have raised tickets.",
    },
    mine: {
      label: "My Tickets",
      icon: Send,
      emptyTitle: "No tickets created",
      emptyDesc:
        "You haven't submitted any support tickets. Need help from admin?",
    },
  };

  const currentTab = tabInfo[tab];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Headset className="h-6 w-6 text-primary" />
            Support & Help
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage student issues and get help from admin.
          </p>
        </div>

        <Link href="/teacher/support/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-1.5" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "assigned" | "student" | "mine")}>
        <TabsList>
          {Object.entries(tabInfo).map(([key, info]) => (
            <TabsTrigger key={key} value={key} className="gap-1.5">
              <info.icon className="h-4 w-4" />
              {info.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Filters (shared across tabs) */}
        <div className="mt-4">
          <TicketFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            category={category}
            onCategoryChange={setCategory}
          />
        </div>

        {/* Content */}
        {Object.keys(tabInfo).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            {initialLoad ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Headset className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{currentTab.emptyTitle}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                  {search || status !== "all" || category !== "all"
                    ? "No tickets match your current filters."
                    : currentTab.emptyDesc}
                </p>
                {tab === "mine" &&
                  !search &&
                  status === "all" &&
                  category === "all" && (
                    <Link href="/teacher/support/new">
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        Create a Ticket
                      </Button>
                    </Link>
                  )}
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <TicketListCard
                    key={ticket.id}
                    ticket={ticket}
                    href={`/teacher/support/${ticket.id}`}
                    showCreatedBy={tab !== "mine"}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
