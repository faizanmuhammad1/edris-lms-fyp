import { StatCard, StatGrid } from "@/app/teacher/_components/StatCard";
import { formatDate } from "@/app/teacher/_components/format";
import { MemberManagement } from "@/components/community/MemberManagement";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Eye, GraduationCap, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { CommunityDetailsForm, DeleteCommunityCard } from "./community-settings";

export type CommunityDashboardTab = "overview" | "members" | "settings";

export interface TeacherCommunityDashboardData {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  courseId: string | null;
  courseTitle: string | null;
  enrolledCount: number | null;
  memberCount: number;
  postCount: number;
}

interface TeacherCommunityDashboardProps {
  community: TeacherCommunityDashboardData;
  initialTab?: CommunityDashboardTab;
}

/** Teacher view of a community: overview stats, member moderation and community settings. */
export function TeacherCommunityDashboard({ community, initialTab = "overview" }: TeacherCommunityDashboardProps) {
  const forumHref = `/teacher/communities/${community.slug}/forum`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{community.name}</span>}
        description="Review activity, moderate members and update this community's details."
        backHref="/teacher/communities"
        backLabel="All communities"
        actions={
          <>
            <Link
              href={`/dashboard/forum/${community.slug}`}
              className={buttonVariants({ variant: "outline", className: "h-10" })}
            >
              <Eye aria-hidden="true" />
              Student view
            </Link>
            <Link href={forumHref} className={buttonVariants({ className: "h-10" })}>
              <MessageSquare aria-hidden="true" />
              Open forum
            </Link>
          </>
        }
      />

      {/* key: remount when a link switches ?tab= on the same page */}
      <Tabs key={initialTab} defaultValue={initialTab} className="gap-4">
        <TabsList className="h-10 w-full sm:w-fit" aria-label="Community sections">
          <TabsTrigger value="overview" className="px-4">
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="px-4">
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-4">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <h2 className="sr-only">Overview</h2>
          <StatGrid>
            <StatCard
              label="Members"
              value={community.memberCount}
              icon={Users}
              description="Students and moderators who joined"
            />
            <StatCard
              label="Posts"
              value={community.postCount}
              icon={MessageSquare}
              description="Discussions started in the forum"
            />
            {community.enrolledCount !== null && (
              <StatCard
                label="Enrolled students"
                value={community.enrolledCount}
                icon={GraduationCap}
                description="Enrollments in the linked course"
              />
            )}
            <StatCard
              label="Created"
              value={<span className="text-xl sm:text-2xl">{formatDate(community.createdAt)}</span>}
              icon={CalendarDays}
            />
          </StatGrid>

          <Card>
            <CardHeader>
              <h3 className="font-semibold leading-none">About this community</h3>
              <CardDescription>What students see before they join.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm whitespace-pre-wrap break-words">{community.description}</p>
              {community.courseId && community.courseTitle && (
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                  <GraduationCap className="size-4 shrink-0" aria-hidden="true" />
                  Linked course:
                  <Link
                    href={`/teacher/courses/${community.courseId}/edit`}
                    className="min-w-0 font-medium break-words text-foreground underline-offset-4 hover:underline"
                  >
                    {community.courseTitle}
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <h2 className="font-semibold leading-none">Members</h2>
              <CardDescription>
                Ban members who break the community guidelines (their posts stay), or remove them together with
                everything they posted here.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <MemberManagement communityId={community.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h2 className="sr-only">Settings</h2>
          <CommunityDetailsForm
            slug={community.slug}
            initialValues={{ name: community.name, description: community.description }}
          />
          <DeleteCommunityCard
            slug={community.slug}
            name={community.name}
            memberCount={community.memberCount}
            postCount={community.postCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
