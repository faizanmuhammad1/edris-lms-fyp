import type { Metadata } from "next";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageHeader } from "@/components/general/PageHeader";
import { CreateCommunityForm } from "./_components/CreateCommunityForm";

export const metadata: Metadata = {
  title: "Admin · New community",
};

export default async function CreateCommunityPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create community"
        description="Set up a new discussion forum where students can ask questions and share ideas."
        backHref="/admin/communities"
        backLabel="Back to communities"
      />
      <CreateCommunityForm />
    </div>
  );
}
