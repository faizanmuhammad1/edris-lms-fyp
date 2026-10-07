import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunity } from "@/app/actions/community";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { CommunityDashboard, type CommunityDashboardTab } from "@/components/community/CommunityDashboard";

export const metadata: Metadata = {
    title: "Admin · Community",
};

const TABS: CommunityDashboardTab[] = ["overview", "members", "settings"];

export default async function ManageCommunityPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ tab?: string | string[] }>;
}) {
    await requireAdmin();
    const [{ slug }, { tab }] = await Promise.all([params, searchParams]);
    const community = await getCommunity(slug);

    if (!community) {
        notFound();
    }

    const defaultTab = TABS.find((t) => t === tab) ?? "overview";

    return <CommunityDashboard community={community} role="admin" defaultTab={defaultTab} />;
}
