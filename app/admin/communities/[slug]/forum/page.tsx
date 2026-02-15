import { getCommunity, getPosts } from "@/app/actions/community";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { notFound } from "next/navigation";
import { AdminCommunityForum } from "@/components/community/AdminCommunityForum";

export const dynamic = "force-dynamic";

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
  const forumBasePath = `/admin/communities/${slug}/forum`;

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
      forumBasePath={forumBasePath}
    />
  );
}
