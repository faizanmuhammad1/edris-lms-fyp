import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Headset, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "../_components/PageContainer";
import { SettingsForm } from "./_components/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile and preferences",
};

async function getStudentProfile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
}

export default async function StudentSettingsPage() {
  const profile = await getStudentProfile();

  if (!profile) {
    redirect("/login");
  }

  const initials =
    profile.name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S";

  return (
    <PageContainer width="medium">
      <PageHeader title="Settings" description="Manage your profile and preferences." />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
              <User className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>
                <h2 className="text-lg font-semibold">Profile</h2>
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 sm:size-20">
              <AvatarImage src={profile.image || undefined} alt="" />
              <AvatarFallback className="text-xl" aria-hidden="true">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium break-words">{profile.name}</p>
              <p className="text-sm break-all text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <SettingsForm
            initialData={{
              name: profile.name,
              email: profile.email,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
              <Headset className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>
                <h2 className="text-lg font-semibold">Need help with your account?</h2>
              </CardTitle>
              <CardDescription>Email changes and account issues are handled by our support team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard/support/new">Contact support</Link>
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
