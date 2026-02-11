
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { redirect } from "next/navigation";
import { SettingsForm } from "./_components/SettingsForm";

export const metadata = {
    title: "Settings | Dashboard",
    description: "Manage your profile and preferences",
};

async function getStudentProfile() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    });

    return user;
}

export default async function StudentSettingsPage() {
    const profile = await getStudentProfile();

    if (!profile) {
        redirect("/login");
    }

    const initials = profile?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "S";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your profile and preferences.
                </p>
            </div>

            <div className="grid gap-6 max-w-4xl">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>Your personal information</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={profile?.image || undefined} alt={profile?.name || "Student"} />
                                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                            </Avatar>
                        </div>

                        <SettingsForm
                            initialData={{
                                name: profile.name,
                                email: profile.email
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
