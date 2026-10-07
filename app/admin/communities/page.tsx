import { MessagesSquare, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCommunities } from "@/app/actions/community";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { CommunityGrid, type CommunityGridItem } from "./_components/CommunityGrid";

export const metadata: Metadata = {
  title: "Admin · Communities",
  description: "Create and moderate community forums",
};

export default async function CommunitiesPage() {
  await requireAdmin();
  const communities = await getCommunities();

  const items: CommunityGridItem[] = communities.map((community) => ({
    id: community.id,
    name: community.name,
    slug: community.slug,
    description: community.description,
    courseTitle: community.course?.title ?? null,
    teacherName: community.course?.user?.name ?? null,
    memberCount: community._count.members,
    postCount: community._count.posts,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communities"
        description="Create discussion forums for courses or the whole platform, and moderate their members and posts."
        actions={
          <Link href="/admin/communities/create" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden="true" />
            Create community
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No communities yet"
          description="Communities give students a place to ask questions and discuss course material. Create the first one to get started."
          buttonText="Create community"
          href="/admin/communities/create"
        />
      ) : (
        <CommunityGrid communities={items} />
      )}
    </div>
  );
}
