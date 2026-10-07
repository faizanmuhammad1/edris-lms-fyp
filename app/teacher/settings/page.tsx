import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, CreditCard, Link as LinkIcon } from "lucide-react";
import { TeacherProfileForm } from "./_components/TeacherProfileForm";

export const metadata = {
    title: "Settings | Teacher Dashboard",
    description: "Manage your profile and preferences",
};

async function getTeacherProfile() {
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
            _count: {
                select: {
                    courses: true,
                },
            },
        },
    });

    return user;
}

export default async function TeacherSettingsPage() {
    await requireTeacher();
    const profile = await getTeacherProfile();

    const initials = profile?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "T";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your profile and teaching preferences.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>Your public instructor profile</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={profile?.image || undefined} alt={profile?.name || "Teacher"} />
                                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <Button variant="outline" size="sm" disabled>
                                    Change Photo
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Photo uploads are not available yet.
                                </p>
                            </div>
                        </div>

                        <TeacherProfileForm
                            name={profile?.name || ""}
                            email={profile?.email || ""}
                        />
                    </CardContent>
                </Card>

                {/* Social Links */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <LinkIcon className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle>Social Links</CardTitle>
                                <CardDescription>Coming soon: social links can&apos;t be saved yet</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input id="linkedin" placeholder="https://linkedin.com/in/yourprofile" disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="twitter">Twitter / X</Label>
                            <Input id="twitter" placeholder="https://twitter.com/yourhandle" disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website">Personal Website</Label>
                            <Input id="website" placeholder="https://yourwebsite.com" disabled />
                        </div>
                        <Button variant="outline" disabled>Update Links (coming soon)</Button>
                    </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Email notification preferences (not configurable yet)</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">New Enrollments</p>
                                <p className="text-sm text-muted-foreground">
                                    Get notified when students enroll in your courses
                                </p>
                            </div>
                            <Switch defaultChecked disabled />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">New Reviews</p>
                                <p className="text-sm text-muted-foreground">
                                    Receive alerts for new course reviews
                                </p>
                            </div>
                            <Switch defaultChecked disabled />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Student Questions</p>
                                <p className="text-sm text-muted-foreground">
                                    Get notified for discussion posts
                                </p>
                            </div>
                            <Switch defaultChecked disabled />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Marketing Emails</p>
                                <p className="text-sm text-muted-foreground">
                                    Tips and best practices for instructors
                                </p>
                            </div>
                            <Switch disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle>Payment Settings</CardTitle>
                                <CardDescription>Manage your payout preferences</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Payout settings are not available in the dashboard yet.
                                Contact support for payout questions.
                            </p>
                        </div>
                        <Button variant="outline" disabled>
                            Open Stripe Dashboard (coming soon)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
