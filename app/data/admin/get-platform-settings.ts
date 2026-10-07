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

/** Mirrors the Prisma defaults, used until the settings row is first saved. */
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
    select: {
      platformName: true,
      supportEmail: true,
      notifyNewEnrollments: true,
      notifyTeacherApplications: true,
      notifySystemAlerts: true,
      sessionTimeoutEnabled: true,
      sessionTimeoutMinutes: true,
    },
  });

  return row ?? defaults;
}
