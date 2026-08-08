"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const DEFAULT_ID = "default";

export type SaveSettingsResult = { ok: true } | { ok: false; error: string };

export async function savePlatformSettingsAction(formData: FormData): Promise<SaveSettingsResult> {
  try {
    await requireAdmin();

    const platformName = (formData.get("platformName") as string)?.trim() ?? "";
    const supportEmail = (formData.get("supportEmail") as string)?.trim() ?? "";

    if (!platformName || platformName.length < 2) {
      return { ok: false, error: "Platform name must be at least 2 characters." };
    }
    if (!supportEmail) {
      return { ok: false, error: "Support email is required." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      return { ok: false, error: "Please enter a valid support email." };
    }

    await prisma.platformSettings.upsert({
      where: { id: DEFAULT_ID },
      create: { id: DEFAULT_ID, platformName, supportEmail },
      update: { platformName, supportEmail },
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (e) {
    console.error("savePlatformSettingsAction:", e);
    return { ok: false, error: "Failed to save settings." };
  }
}

export async function saveNotificationSettingsAction(payload: {
  notifyNewEnrollments: boolean;
  notifyTeacherApplications: boolean;
  notifySystemAlerts: boolean;
}): Promise<SaveSettingsResult> {
  try {
    await requireAdmin();
    await prisma.platformSettings.upsert({
      where: { id: DEFAULT_ID },
      create: {
        id: DEFAULT_ID,
        platformName: "Edris LMS",
        supportEmail: "support@example.com",
        ...payload,
      },
      update: payload,
    });
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (e) {
    console.error("saveNotificationSettingsAction:", e);
    return { ok: false, error: "Failed to save notification settings." };
  }
}

export async function saveSecuritySettingsAction(payload: {
  sessionTimeoutEnabled: boolean;
  sessionTimeoutMinutes?: number;
}): Promise<SaveSettingsResult> {
  try {
    await requireAdmin();
    const { sessionTimeoutMinutes, ...rest } = payload;
    await prisma.platformSettings.upsert({
      where: { id: DEFAULT_ID },
      create: {
        id: DEFAULT_ID,
        platformName: "Edris LMS",
        supportEmail: "support@example.com",
        sessionTimeoutEnabled: rest.sessionTimeoutEnabled,
        sessionTimeoutMinutes: Math.min(120, Math.max(5, sessionTimeoutMinutes ?? 30)),
      },
      update: {
        ...rest,
        ...(typeof sessionTimeoutMinutes === "number" && {
          sessionTimeoutMinutes: Math.min(120, Math.max(5, sessionTimeoutMinutes)),
        }),
      },
    });
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (e) {
    console.error("saveSecuritySettingsAction:", e);
    return { ok: false, error: "Failed to save security settings." };
  }
}
