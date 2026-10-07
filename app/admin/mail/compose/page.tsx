import { getMailComposeData } from "@/app/data/admin/get-mail-compose-data";
import { PageHeader } from "@/components/general/PageHeader";
import { ComposeForm } from "../_components/ComposeForm";

export const metadata = {
  title: "Admin · New campaign",
};

// Server actions invoked from this page (sendCampaign) inherit this limit;
// large audiences are sent in throttled batches.
export const maxDuration = 300;

export default async function ComposeNewPage() {
  // getMailComposeData() calls requireAdmin().
  const { courses, categories } = await getMailComposeData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New campaign"
        description="Write your message, choose who receives it, then preview and send."
        backHref="/admin/mail"
        backLabel="Back to campaigns"
      />
      <ComposeForm
        initialSubject=""
        initialBodyJson=""
        initialAudienceType="Subscribers"
        courses={courses}
        categories={categories}
      />
    </div>
  );
}
