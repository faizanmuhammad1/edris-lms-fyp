import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeCallbackPath } from "@/lib/safe-redirect";
import { ProfileSetupForm } from "./_components/ProfileSetupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Complete your profile",
    robots: { index: false, follow: false },
};

export default async function ProfileSetupPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // If not logged in, redirect to login
    if (!session) {
        redirect("/login");
    }

    const callbackURL = safeCallbackPath((await props.searchParams)?.callbackURL);
    // /login sends signed-in users to their callback or their role's home page.
    const nextUrl = callbackURL
        ? `/login?callbackURL=${encodeURIComponent(callbackURL)}`
        : "/login";

    // If user already has a proper name (not just email prefix), skip setup.
    // Check if name is different from email (Google users have proper names)
    const hasProperName = session.user.name &&
        session.user.name.trim().length > 0 &&
        session.user.name !== session.user.email?.split("@")[0];

    if (hasProperName) {
        redirect(nextUrl);
    }

    return <ProfileSetupForm nextUrl={nextUrl} />;
}
