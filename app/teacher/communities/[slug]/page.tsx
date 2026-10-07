import { getCommunity } from "@/app/actions/community";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  TeacherCommunityDashboard,
  type CommunityDashboardTab,
} from "./_components/teacher-community-dashboard";

export const metadata: Metadata = { title: "Manage community" };

export const dynamic = "force-dynamic";

const TABS: CommunityDashboardTab[] = ["overview", "members", "settings"];

export default async function TeacherManageCommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ slug }, { tab }] = await Promise.all([params, searchParams]);
  const community = await getCommunity(slug);

  // Only moderators (course owner / admin) can manage a community
  if (!community || !community.canModerate) {
    notFound();
  }

  const initialTab = TABS.find((t) => t === tab) ?? "overview";

  return (
    <TeacherCommunityDashboard
      initialTab={initialTab}
      community={{
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description,
        createdAt: community.createdAt,
        courseId: community.courseId,
        courseTitle: community.course?.title ?? null,
        enrolledCount: community.course?._count.enrollment ?? null,
        memberCount: community._count.members,
        postCount: community._count.posts,
      }}
    />
  );
}
