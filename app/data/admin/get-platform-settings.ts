import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

const DEFAULT_ID = "default";

export type PlatformSettingsRow = {
  platformName: string;
  supportEmail: string;
  notifyNewEnrollments: boolean;
  notifyTeacherApplications: boolean;
  notifySystemAlerts: boolean;
  sessionTimeoutEnabled: boolean;
  sessionTimeoutMinutes: number;
};

const defaults: PlatformSettingsRow = {
  platformName: "Edris LMS",
  supportEmail: "support@example.com",
  notifyNewEnrollments: true,
  notifyTeacherApplications: true,
  notifySystemAlerts: true,
  sessionTimeoutEnabled: true,
  sessionTimeoutMinutes: 30,
};

export async function getPlatformSettings(): Promise<PlatformSettingsRow> {
  await requireAdmin();

  const row = await prisma.platformSettings.findUnique({
    where: { id: DEFAULT_ID },
  });

  if (!row) return defaults;

  return {
    platformName: row.platformName,
    supportEmail: row.supportEmail,
    notifyNewEnrollments: row.notifyNewEnrollments,
    notifyTeacherApplications: row.notifyTeacherApplications,
    notifySystemAlerts: row.notifySystemAlerts,
    sessionTimeoutEnabled: row.sessionTimeoutEnabled,
    sessionTimeoutMinutes: row.sessionTimeoutMinutes,
  };
}
