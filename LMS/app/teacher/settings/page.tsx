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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, CreditCard, Link as LinkIcon } from "lucide-react";

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
                                <Button variant="outline" size="sm">
                                    Change Photo
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG or GIF. Max 2MB.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" defaultValue={profile?.name || ""} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue={profile?.email || ""} disabled />
                                <p className="text-xs text-muted-foreground">
                                    Contact support to change email
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="Tell students about yourself, your expertise, and teaching style..."
                                defaultValue=""
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                This appears on your course pages
                            </p>
                        </div>

                        <Button>Save Profile</Button>
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
                                <CardDescription>Connect your social profiles</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input id="linkedin" placeholder="https://linkedin.com/in/yourprofile" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="twitter">Twitter / X</Label>
                            <Input id="twitter" placeholder="https://twitter.com/yourhandle" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website">Personal Website</Label>
                            <Input id="website" placeholder="https://yourwebsite.com" />
                        </div>
                        <Button variant="outline">Update Links</Button>
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
                                <CardDescription>Email notification preferences</CardDescription>
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
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">New Reviews</p>
                                <p className="text-sm text-muted-foreground">
                                    Receive alerts for new course reviews
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Student Questions</p>
                                <p className="text-sm text-muted-foreground">
                                    Get notified for discussion posts
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Marketing Emails</p>
                                <p className="text-sm text-muted-foreground">
                                    Tips and best practices for instructors
                                </p>
                            </div>
                            <Switch />
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
                                Payment settings are managed through Stripe Connect.
                                Click below to access your Stripe dashboard.
                            </p>
                        </div>
                        <Button variant="outline">
                            Open Stripe Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
