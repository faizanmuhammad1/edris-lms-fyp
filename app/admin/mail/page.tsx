import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, FileText, Plus, Send, Users } from "lucide-react";
import { getMailOverview, MAIL_CAMPAIGN_LIST_LIMIT } from "@/app/data/admin/get-mail-overview";
import { PageHeader } from "@/components/general/PageHeader";
import { Button } from "@/components/ui/button";
import { StatCard, StatGrid } from "@/app/admin/_components/StatCard";
import { formatNumber, pluralize } from "@/app/admin/_lib/format";
import { CampaignsTable, type CampaignRow } from "./_components/CampaignsTable";
import { describeAudience, getCampaignStatus, toAudiencePayload } from "./_lib/campaign";

export const metadata = {
  title: "Admin · Mail",
};

export default async function AdminMailPage() {
  // getMailOverview() calls requireAdmin().
  const {
    subscriberCount,
    campaigns,
    totalCampaigns,
    draftCount,
    partialCount,
    lastSentAt,
    courseTitles,
  } = await getMailOverview();

  const rows: CampaignRow[] = campaigns.map((c) => {
    const status = getCampaignStatus(c);
    const payload = toAudiencePayload(c.audiencePayload);
    const date = c.sentAt ?? c.updatedAt;
    return {
      id: c.id,
      subject: c.subject,
      status,
      audience: describeAudience(
        c.audienceType,
        payload,
        payload?.courseId ? courseTitles[payload.courseId] : null
      ),
      recipientCount: c.recipientCount,
      dateValue: date.getTime(),
      dateIso: date.toISOString(),
      dateLabel: format(date, "MMM d, yyyy, HH:mm"),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mail"
        description="Send email campaigns to newsletter subscribers, students or teachers."
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/mail/compose">
              <Plus aria-hidden="true" />
              New campaign
            </Link>
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Subscribers"
          value={formatNumber(subscriberCount)}
          icon={Users}
          description="Confirmed newsletter subscribers"
        />
        <StatCard
          label="Drafts"
          value={formatNumber(draftCount)}
          icon={FileText}
          tone="neutral"
          description={draftCount === 1 ? "Campaign not sent yet" : "Campaigns not sent yet"}
        />
        <StatCard
          label="Partially sent"
          value={formatNumber(partialCount)}
          icon={AlertTriangle}
          tone={partialCount > 0 ? "warning" : "neutral"}
          description={
            partialCount > 0 ? "Need a retry to reach everyone" : "No unfinished sends"
          }
        />
        <StatCard
          label="Last sent"
          value={
            lastSentAt ? (
              <time dateTime={lastSentAt.toISOString()}>{format(lastSentAt, "MMM d, yyyy")}</time>
            ) : (
              "Never"
            )
          }
          icon={Send}
          tone="success"
          description={lastSentAt ? "Most recent completed campaign" : "No campaigns sent yet"}
        />
      </StatGrid>

      <section aria-labelledby="campaigns-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="campaigns-heading" className="text-lg font-semibold">
            Campaigns
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalCampaigns > campaigns.length
              ? `Showing the ${formatNumber(MAIL_CAMPAIGN_LIST_LIMIT)} most recently updated of ${pluralize(totalCampaigns, "campaign")}.`
              : "Drafts can be edited; sent campaigns open read-only."}
          </p>
        </div>
        <CampaignsTable campaigns={rows} />
      </section>
    </div>
  );
}
