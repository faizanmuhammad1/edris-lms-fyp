import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconMessageCircle, IconSettings, IconExternalLink } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MemberManagement } from "@/components/community/MemberManagement";
import { EditCommunityForm } from "@/app/admin/communities/[slug]/edit-community-form";

interface TeacherCommunityDashboardProps {
    community: any; // Type should be inferred ideally or imported
}

export function TeacherCommunityDashboard({ community }: TeacherCommunityDashboardProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{community.name}</h1>
                    <p className="text-muted-foreground">
                        Manage your community settings and members
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/forum/${community.slug}`} target="_blank">
                        <IconExternalLink className="mr-2 h-4 w-4" />
                        View as Student
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                                <IconUsers className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{community._count.members}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                                <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{community._count.posts}</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Member Management</CardTitle>
                            <CardDescription>
                                Manage members of your community. You can ban users who violate community guidelines.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MemberManagement communityId={community.id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Community Settings</CardTitle>
                            <CardDescription>
                                Update your community details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EditCommunityForm initialData={community} role="teacher" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
