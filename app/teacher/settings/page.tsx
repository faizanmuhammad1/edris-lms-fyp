import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { formatDate, initials } from "@/app/teacher/_components/format";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { prisma } from "@/lib/db";
import { Bell, Clock, CreditCard, Link as LinkIcon, User, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TeacherProfileForm } from "./_components/TeacherProfileForm";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your instructor profile and preferences",
};

const NOTIFICATION_PREFERENCES = [
  {
    id: "notify-enrollments",
    label: "New enrollments",
    description: "When a student enrolls in one of your courses.",
    defaultChecked: true,
  },
  {
    id: "notify-reviews",
    label: "New reviews",
    description: "When a student reviews one of your courses.",
    defaultChecked: true,
  },
  {
    id: "notify-questions",
    label: "Student questions",
    description: "When students post in your lesson discussions.",
    defaultChecked: true,
  },
  {
    id: "notify-marketing",
    label: "Tips for instructors",
    description: "Occasional best practices and product news.",
    defaultChecked: false,
  },
];

const SOCIAL_LINKS = [
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourprofile" },
  { id: "twitter", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { id: "website", label: "Personal website", placeholder: "https://yourwebsite.com" },
];

function SectionHeader({
  icon: Icon,
  title,
  description,
  comingSoon = false,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  comingSoon?: boolean;
}) {
  return (
    <CardHeader>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold leading-none">{title}</h2>
            {comingSoon && (
              <Badge variant="outline" className="gap-1">
                <Clock aria-hidden="true" />
                Coming soon
              </Badge>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

export default async function TeacherSettingsPage() {
  const session = await requireTeacher();

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: { select: { courses: true } },
    },
  });

  const name = profile?.name ?? session.user.name ?? "";
  const email = profile?.email ?? session.user.email;
  const courseCount = profile?._count.courses ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your instructor profile and preferences." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card className="min-w-0 lg:col-span-2">
          <SectionHeader icon={User} title="Profile" description="How you appear to students on your courses and in communities." />
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-16 sm:size-20">
                <AvatarImage src={profile?.image ?? undefined} alt="" />
                <AvatarFallback className="text-lg sm:text-xl">{initials(name || email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium break-words">{name || "No display name"}</p>
                <p className="text-sm break-all text-muted-foreground">{email}</p>
                <p className="text-sm text-muted-foreground">
                  {courseCount} {courseCount === 1 ? "course" : "courses"}
                  {profile?.createdAt && <> · Instructor since {formatDate(profile.createdAt)}</>}
                </p>
              </div>
              <div className="w-full space-y-1 sm:w-auto">
                <Button variant="outline" className="h-10 w-full sm:w-auto" disabled aria-describedby="photo-help">
                  Change photo
                </Button>
                <p id="photo-help" className="text-xs text-muted-foreground">
                  Photo uploads aren&apos;t available yet.
                </p>
              </div>
            </div>

            <Separator />

            <TeacherProfileForm name={name} email={email} />
          </CardContent>
        </Card>

        {/* Social links */}
        <Card className="min-w-0">
          <SectionHeader
            icon={LinkIcon}
            title="Social links"
            description="Links shown on your instructor profile. Saving links isn't available yet."
            comingSoon
          />
          <CardContent className="space-y-4">
            {SOCIAL_LINKS.map((link) => (
              <div key={link.id} className="grid gap-2">
                <Label htmlFor={link.id}>{link.label}</Label>
                <Input id={link.id} type="url" placeholder={link.placeholder} className="w-full" disabled />
              </div>
            ))}
            <Button variant="outline" className="h-10 w-full sm:w-auto" disabled>
              Save links
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="min-w-0">
          <SectionHeader
            icon={Bell}
            title="Email notifications"
            description="Choose which emails you receive. These preferences can't be changed yet."
            comingSoon
          />
          <CardContent>
            <ul className="divide-y">
              {NOTIFICATION_PREFERENCES.map((pref) => (
                <li key={pref.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor={pref.id} className="font-medium">
                      {pref.label}
                    </Label>
                    <p id={`${pref.id}-description`} className="text-sm text-muted-foreground">
                      {pref.description}
                    </p>
                  </div>
                  <Switch
                    id={pref.id}
                    defaultChecked={pref.defaultChecked}
                    disabled
                    aria-describedby={`${pref.id}-description`}
                    className="mt-0.5"
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card className="min-w-0 lg:col-span-2">
          <SectionHeader
            icon={CreditCard}
            title="Payouts"
            description="Where your course earnings are paid out."
            comingSoon
          />
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Payout settings aren&apos;t available in the dashboard yet. Open a support ticket for payout questions.
            </p>
            <Button variant="outline" className="h-10 w-full shrink-0 sm:w-auto" disabled>
              Open Stripe dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
