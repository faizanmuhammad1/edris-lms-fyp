import { getCommunity } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { CommunityDashboard } from "@/components/community/CommunityDashboard";

export default async function ManageCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const community = await getCommunity(slug);

    if (!community) {
        notFound();
    }

    return <CommunityDashboard community={community} role="admin" />;
}
