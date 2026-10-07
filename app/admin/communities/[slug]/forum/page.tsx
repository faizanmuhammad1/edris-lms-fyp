import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunity, getPosts } from "@/app/actions/community";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { AdminCommunityForum } from "@/components/community/AdminCommunityForum";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Community forum",
};

export default async function AdminCommunityForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const community = await getCommunity(slug);

  if (!community) {
    notFound();
  }

  const posts = await getPosts(community.id);

  return (
    <AdminCommunityForum
      community={{
        id: community.id,
        name: community.name,
        description: community.description,
        slug: community.slug,
        memberCount: community.memberCount,
        _count: community._count,
      }}
      posts={posts}
      forumBasePath={`/admin/communities/${community.slug}/forum`}
    />
  );
}
