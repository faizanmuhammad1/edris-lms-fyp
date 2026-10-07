import { notFound, unstable_rethrow } from "next/navigation";
import { format } from "date-fns";
import { getMailComposeData, getMailCampaignById } from "@/app/data/admin/get-mail-compose-data";
import { getUnsentRecipientCount } from "@/app/data/admin/get-mail-recipients";
import { PageHeader } from "@/components/general/PageHeader";
import { ComposeForm } from "../../_components/ComposeForm";
import { CampaignStatusBadge } from "../../_components/CampaignStatusBadge";
import { getCampaignStatus, toAudiencePayload, type CampaignStatus } from "../../_lib/campaign";

export const metadata = {
  title: "Admin · Campaign",
};

// Server actions invoked from this page (sendCampaign) inherit this limit;
// large audiences are sent in throttled batches.
export const maxDuration = 300;

const HEADINGS: Record<CampaignStatus, { title: string; description: string }> = {
  draft: {
    title: "Edit draft",
    description: "Update the message or audience, then save, preview or send.",
  },
  partial: {
    title: "Partially sent campaign",
    description: "Some recipients haven't received this campaign yet. You can retry the unsent recipients.",
  },
  sent: {
    title: "Sent campaign",
    description: "A read-only record of what was sent and who received it.",
  },
};

type Props = { params: Promise<{ campaignId: string }> };

export default async function ComposeEditPage({ params }: Props) {
  const { campaignId } = await params;
  // Both data functions call requireAdmin().
  const [composeData, campaign] = await Promise.all([
    getMailComposeData(),
    getMailCampaignById(campaignId),
  ]);

  if (!campaign) notFound();

  const status = getCampaignStatus(campaign);
  // Only needed for the partial-send summary; the count is re-checked before sending.
  let unsentCount: number | null = null;
  if (status === "partial") {
    try {
      unsentCount = await getUnsentRecipientCount(campaign.id);
    } catch (error) {
      unstable_rethrow(error);
      console.error("Failed to count unsent recipients:", error);
    }
  }
  const heading = HEADINGS[status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={heading.title}
        description={heading.description}
        backHref="/admin/mail"
        backLabel="Back to campaigns"
        actions={<CampaignStatusBadge status={status} />}
      />
      <ComposeForm
        campaignId={campaign.id}
        status={status}
        initialSubject={campaign.subject}
        initialBodyJson={campaign.bodyJson ?? ""}
        initialBodyHtml={campaign.bodyHtml}
        initialAudienceType={campaign.audienceType}
        initialAudiencePayload={toAudiencePayload(campaign.audiencePayload)}
        audienceCourse={campaign.audienceCourse}
        courses={composeData.courses}
        categories={composeData.categories}
        sentCount={campaign.recipientCount}
        sentAtLabel={campaign.sentAt ? format(campaign.sentAt, "MMM d, yyyy 'at' HH:mm") : null}
        unsentCount={unsentCount}
      />
    </div>
  );
}
