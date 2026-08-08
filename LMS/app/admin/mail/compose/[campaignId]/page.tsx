import { getMailComposeData, getMailCampaignById } from "@/app/data/admin/get-mail-compose-data";
import { ComposeForm } from "../../_components/ComposeForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Campaign | Mail | Admin | Edris LMS",
};

type Props = { params: Promise<{ campaignId: string }> };

export default async function ComposeEditPage({ params }: Props) {
  const { campaignId } = await params;
  const [composeData, campaign] = await Promise.all([
    getMailComposeData(),
    getMailCampaignById(campaignId),
  ]);

  if (!campaign) notFound();

  const payload = campaign.audiencePayload as {
    courseId?: string;
    category?: string;
    level?: string;
    emails?: string[];
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/mail">
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{campaign.sentAt ? "View campaign" : "Edit draft"}</h1>
      </div>
      <ComposeForm
        campaignId={campaign.id}
        initialSubject={campaign.subject}
        initialBodyJson={campaign.bodyJson ?? ""}
        initialAudienceType={campaign.audienceType}
        initialAudiencePayload={payload ?? undefined}
        courses={composeData.courses}
        categories={composeData.categories}
        isSent={!!campaign.sentAt}
      />
    </div>
  );
}
