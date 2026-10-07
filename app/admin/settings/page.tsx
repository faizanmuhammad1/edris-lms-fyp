import { requireAdmin } from "@/app/data/admin/require-admin";
import { getPlatformSettings } from "@/app/data/admin/get-platform-settings";
import { PlatformSettingsForm } from "./_components/PlatformSettingsForm";
import { NotificationSettingsForm } from "./_components/NotificationSettingsForm";
import { SecuritySettingsForm } from "./_components/SecuritySettingsForm";
import { DataExportCard } from "./_components/DataExportCard";

export const metadata = {
    title: "Settings | Admin Dashboard",
    description: "Manage platform settings and configurations",
};

export default async function AdminSettingsPage() {
    await requireAdmin();
    const settings = await getPlatformSettings();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage platform-wide settings and configurations.
                </p>
            </div>

            <div className="grid gap-6">
                <PlatformSettingsForm
                    platformName={settings.platformName}
                    supportEmail={settings.supportEmail}
                />

                <NotificationSettingsForm
                    notifyNewEnrollments={settings.notifyNewEnrollments}
                    notifyTeacherApplications={settings.notifyTeacherApplications}
                    notifySystemAlerts={settings.notifySystemAlerts}
                />

                <SecuritySettingsForm
                    sessionTimeoutEnabled={settings.sessionTimeoutEnabled}
                    sessionTimeoutMinutes={settings.sessionTimeoutMinutes}
                />

                <DataExportCard />
            </div>
        </div>
    );
}
