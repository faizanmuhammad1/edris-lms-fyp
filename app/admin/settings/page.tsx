import type { Metadata } from "next";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { getPlatformSettings } from "@/app/data/admin/get-platform-settings";
import { PageHeader } from "@/components/general/PageHeader";
import { PlatformSettingsForm } from "./_components/PlatformSettingsForm";
import { NotificationSettingsForm } from "./_components/NotificationSettingsForm";
import { SecuritySettingsForm } from "./_components/SecuritySettingsForm";
import { DataExportCard } from "./_components/DataExportCard";

export const metadata: Metadata = {
  title: "Admin · Settings",
  description: "Manage platform settings and configurations",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform-wide configuration. Changes apply to everyone as soon as they are saved."
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <PlatformSettingsForm platformName={settings.platformName} supportEmail={settings.supportEmail} />

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
