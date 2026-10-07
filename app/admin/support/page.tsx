import { AlertTriangle, CheckCircle2, Clock, Inbox, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { StatCard, StatGrid } from "@/app/admin/_components/StatCard";
import { formatNumber, pluralize } from "@/app/admin/_lib/format";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { adminGetAllTickets } from "@/app/data/support/admin-get-all-tickets";
import { adminGetSupportStats } from "@/app/data/support/admin-get-support-stats";
import { PageHeader } from "@/components/general/PageHeader";
import { AdminSupportDashboard } from "./_components/AdminSupportDashboard";

export const metadata: Metadata = {
  title: "Admin · Support",
  description: "Manage support tickets across the platform",
};

export default async function AdminSupportPage() {
  await requireAdmin();
  const [stats, initialTickets] = await Promise.all([adminGetSupportStats(), adminGetAllTickets()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support center"
        description={`Tickets from students and teachers across the platform: ${pluralize(stats.activeTickets, "active ticket")}, ${formatNumber(stats.totalTickets)} in total.`}
      />

      <section aria-labelledby="support-stats-heading">
        <h2 id="support-stats-heading" className="sr-only">
          Ticket summary
        </h2>
        <StatGrid columns={5}>
          <StatCard label="Open" value={formatNumber(stats.openTickets)} icon={Inbox} tone="info" description="Status: Open" />
          <StatCard
            label="In progress"
            value={formatNumber(stats.inProgressTickets)}
            icon={Clock}
            tone="warning"
            description="Status: In Progress"
          />
          <StatCard
            label="Escalated"
            value={formatNumber(stats.escalatedTickets)}
            icon={AlertTriangle}
            tone="danger"
            description="Status: Escalated"
          />
          <StatCard
            label="Resolved today"
            value={formatNumber(stats.resolvedToday)}
            icon={CheckCircle2}
            tone="success"
            description="Since midnight"
          />
          <StatCard
            label="Created today"
            value={formatNumber(stats.createdToday)}
            icon={TrendingUp}
            description="Since midnight"
          />
        </StatGrid>
      </section>

      <AdminSupportDashboard initialTickets={initialTickets} />
    </div>
  );
}
