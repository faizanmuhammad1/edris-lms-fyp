import { getCommunity } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { EditCommunityForm } from "@/app/admin/communities/[slug]/edit-community-form";

export default async function TeacherManageCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const community = await getCommunity(slug);

    if (!community) {
        notFound();
    }

    // Determine role or just pass "teacher".
    // Assuming access control is handled in layout or actions (requireTeacher).

    return <EditCommunityForm initialData={community} role="teacher" />;
}
