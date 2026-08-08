import { getCommunity } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { EditCommunityForm } from "./edit-community-form";

export default async function ManageCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const community = await getCommunity(slug);

    if (!community) {
        notFound();
    }

    return <EditCommunityForm initialData={community} role="admin" />;
}
