import { getCommunity } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { CommunityDashboard } from "@/components/community/CommunityDashboard";
import { requireAdmin } from "@/app/data/admin/require-admin";

export default async function ManageCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
    await requireAdmin();
    const { slug } = await params;
    const community = await getCommunity(slug);

    if (!community) {
        notFound();
    }

    return <CommunityDashboard community={community} role="admin" />;
}
