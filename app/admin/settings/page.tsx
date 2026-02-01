import { requireAdmin } from "@/app/data/admin/require-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, Shield, Database } from "lucide-react";

export const metadata = {
    title: "Settings | Admin Dashboard",
    description: "Manage platform settings and configurations",
};

export default async function AdminSettingsPage() {
    await requireAdmin();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage platform-wide settings and configurations.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Platform Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Settings className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Platform Settings</CardTitle>
                                <CardDescription>General platform configuration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="platform-name">Platform Name</Label>
                            <Input id="platform-name" defaultValue="Edris LMS" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="support-email">Support Email</Label>
                            <Input id="support-email" type="email" placeholder="support@example.com" />
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Configure email and push notifications</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">New Enrollments</p>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications for new course enrollments
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Teacher Applications</p>
                                <p className="text-sm text-muted-foreground">
                                    Get notified when new teacher applications arrive
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">System Alerts</p>
                                <p className="text-sm text-muted-foreground">
                                    Important system warnings and updates
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <CardTitle>Security</CardTitle>
                                <CardDescription>Security and access controls</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-muted-foreground">
                                    Require 2FA for admin accounts
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Session Timeout</p>
                                <p className="text-sm text-muted-foreground">
                                    Auto-logout after 30 minutes of inactivity
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Data Management */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Database className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle>Data Management</CardTitle>
                                <CardDescription>Backup and export options</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Export Data</p>
                                <p className="text-sm text-muted-foreground">
                                    Download all platform data as CSV
                                </p>
                            </div>
                            <Button variant="outline">Export</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
