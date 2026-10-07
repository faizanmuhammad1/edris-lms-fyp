import { getCommunity, getPosts } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { TeacherCommunityForum } from "@/components/community/TeacherCommunityForum";

export const dynamic = "force-dynamic";

export default async function TeacherCommunityForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunity(slug);

  // Only moderators (course owner / admin) use the teacher forum view
  if (!community || !community.canModerate) {
    notFound();
  }

  const posts = await getPosts(community.id);
  const forumBasePath = `/teacher/communities/${slug}/forum`;

  return (
    <TeacherCommunityForum
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
