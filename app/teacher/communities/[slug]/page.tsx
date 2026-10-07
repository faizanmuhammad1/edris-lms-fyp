import { getCommunity } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { CommunityDashboard } from "@/components/community/CommunityDashboard";

export default async function TeacherManageCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const community = await getCommunity(slug);

    // Only moderators (course owner / admin) can manage a community
    if (!community || !community.canModerate) {
        notFound();
    }

    return <CommunityDashboard community={community} role="teacher" />;
}
