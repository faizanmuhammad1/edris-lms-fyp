import { format } from "date-fns";
import { CalendarDays, GraduationCap, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { StatCard, StatGrid } from "@/app/admin/_components/StatCard";
import { formatNumber } from "@/app/admin/_lib/format";
import { EditCommunityForm } from "@/app/admin/communities/[slug]/edit-community-form";
import { MemberManagement } from "@/components/community/MemberManagement";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type CommunityDashboardTab = "overview" | "members" | "settings";

interface CommunityDashboardProps {
    /** A community as returned by getCommunity(). */
    community: {
        id: string;
        name: string;
        slug: string;
        description: string;
        createdAt?: Date | string;
        _count: { members: number; posts: number };
        course?: { title: string; _count?: { enrollment: number } } | null;
    };
    role?: "teacher" | "admin";
    /** Tab shown first, e.g. from a `?tab=` link. */
    defaultTab?: CommunityDashboardTab;
}

/** Management view for one community: overview stats, member moderation and settings. */
export function CommunityDashboard({ community, role = "teacher", defaultTab = "overview" }: CommunityDashboardProps) {
    const basePath = role === "admin" ? "/admin/communities" : "/teacher/communities";
    const forumHref = `${basePath}/${community.slug}/forum`;
    const enrollmentCount = community.course?._count?.enrollment;

    return (
        <div className="space-y-6">
            <PageHeader
                title={<span className="[overflow-wrap:anywhere]">{community.name}</span>}
                description="Manage this community's details, members and moderation."
                backHref={basePath}
                backLabel={role === "admin" ? "All communities" : "My communities"}
                actions={
                    <Link
                        href={forumHref}
                        className={buttonVariants({ variant: role === "teacher" ? "default" : "outline" })}
                    >
                        <MessageSquare className="size-4" aria-hidden="true" />
                        {role === "teacher" ? "Open forum" : "View forum"}
                    </Link>
                }
            />

            <Tabs key={defaultTab} defaultValue={defaultTab} className="gap-4">
                <TabsList className="h-10 w-full sm:w-fit">
                    <TabsTrigger value="overview" className="px-3">
                        <LayoutDashboard aria-hidden="true" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="members" className="px-3">
                        <Users aria-hidden="true" />
                        Members
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="px-3">
                        <Settings aria-hidden="true" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <h2 className="sr-only">Overview</h2>
                    <StatGrid columns={3}>
                        <StatCard
                            label="Members"
                            value={formatNumber(community._count.members)}
                            icon={Users}
                            description="People who joined this community"
                        />
                        <StatCard
                            label="Posts"
                            value={formatNumber(community._count.posts)}
                            icon={MessageSquare}
                            description="Discussions started in the forum"
                        />
                        {community.course ? (
                            <StatCard
                                label="Course enrollments"
                                value={enrollmentCount === undefined ? "—" : formatNumber(enrollmentCount)}
                                icon={GraduationCap}
                                tone="info"
                                description={
                                    <span className="line-clamp-2 [overflow-wrap:anywhere]">
                                        Students enrolled in {community.course.title}
                                    </span>
                                }
                            />
                        ) : (
                            <StatCard
                                label="Audience"
                                value="Platform-wide"
                                icon={GraduationCap}
                                tone="neutral"
                                description="Not linked to a course"
                            />
                        )}
                    </StatGrid>

                    <Card className="gap-4 shadow-xs">
                        <CardHeader className="px-4 sm:px-6">
                            <h2 className="text-base font-semibold leading-tight sm:text-lg">About</h2>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 sm:px-6">
                            <p className="whitespace-pre-line text-sm text-muted-foreground [overflow-wrap:anywhere]">
                                {community.description}
                            </p>
                            <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                                <div className="min-w-0 space-y-0.5">
                                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                                        <GraduationCap className="size-4" aria-hidden="true" />
                                        Linked course
                                    </dt>
                                    <dd className="font-medium [overflow-wrap:anywhere]">
                                        {community.course?.title ?? "None (platform-wide)"}
                                    </dd>
                                </div>
                                {community.createdAt && (
                                    <div className="space-y-0.5">
                                        <dt className="flex items-center gap-1.5 text-muted-foreground">
                                            <CalendarDays className="size-4" aria-hidden="true" />
                                            Created
                                        </dt>
                                        <dd className="font-medium">
                                            {format(new Date(community.createdAt), "MMM d, yyyy")}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members">
                    <Card className="gap-5 shadow-xs">
                        <CardHeader className="px-4 sm:px-6">
                            <h2 className="text-base font-semibold leading-tight sm:text-lg">Member management</h2>
                            <CardDescription>
                                Review members and moderate people who break the community guidelines.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 sm:px-6">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <span className="font-medium text-foreground">Ban</span> removes someone from the
                                    community and stops them rejoining. Their posts stay.
                                </li>
                                <li>
                                    <span className="font-medium text-foreground">Remove</span> takes someone out of the
                                    community and permanently deletes their posts and comments here.
                                </li>
                            </ul>
                            <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                                <p className="text-sm">
                                    <span className="font-medium tabular-nums">
                                        {formatNumber(community._count.members)}
                                    </span>{" "}
                                    {community._count.members === 1 ? "member" : "members"} in this community
                                </p>
                                <MemberManagement communityId={community.id} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <EditCommunityForm initialData={community} role={role} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
