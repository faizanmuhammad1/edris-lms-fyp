import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileSetupForm } from "./_components/ProfileSetupForm";

export default async function ProfileSetupPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // If not logged in, redirect to login
    if (!session) {
        redirect("/login");
    }

    // If user already has a proper name (not just email prefix), redirect to dashboard
    // Check if name is different from email (Google users have proper names)
    const hasProperName = session.user.name &&
        session.user.name.trim().length > 0 &&
        session.user.name !== session.user.email?.split("@")[0];

    if (hasProperName) {
        redirect("/dashboard");
    }

    return <ProfileSetupForm />;
}
