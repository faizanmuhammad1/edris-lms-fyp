import { getMailComposeData } from "@/app/data/admin/get-mail-compose-data";
import { ComposeForm } from "../_components/ComposeForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

export const metadata = {
  title: "New campaign | Mail | Admin | Edris LMS",
};

// Server actions invoked from this page (sendCampaign) inherit this limit;
// large audiences are sent in throttled batches.
export const maxDuration = 300;

export default async function ComposeNewPage() {
  const { courses, categories } = await getMailComposeData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/mail">
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New campaign</h1>
      </div>
      <ComposeForm
        initialSubject=""
        initialBodyJson=""
        initialAudienceType="Subscribers"
        initialAudiencePayload={undefined}
        courses={courses}
        categories={categories}
      />
    </div>
  );
}
