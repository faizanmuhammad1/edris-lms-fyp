"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import {
  notificationSettingsSchema,
  platformSettingsSchema,
  securitySettingsSchema,
  type SettingsActionResult,
} from "./schemas";

const DEFAULT_ID = "default";

/** Values used when the settings row does not exist yet (mirror the Prisma defaults). */
const ROW_DEFAULTS = {
  id: DEFAULT_ID,
  platformName: "Edris LMS",
  supportEmail: "support@example.com",
};

/**
 * Validates the input, runs the update as an admin and turns failures into a
 * message the UI can show (thrown errors are hidden in production builds).
 */
async function runSettingsAction<T>(
  schema: z.ZodType<T>,
  input: unknown,
  successMessage: string,
  failureMessage: string,
  save: (values: T) => Promise<void>
): Promise<SettingsActionResult> {
  try {
    await requireAdmin();

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Please check the highlighted fields.",
      };
    }

    await save(parsed.data);
    revalidatePath("/admin/settings");
    return { status: "success", message: successMessage };
  } catch (error) {
    // Let requireAdmin()'s redirect propagate.
    unstable_rethrow(error);
    console.error(failureMessage, error);
    return { status: "error", message: `${failureMessage} Please try again.` };
  }
}

export async function savePlatformSettingsAction(input: unknown): Promise<SettingsActionResult> {
  return runSettingsAction(
    platformSettingsSchema,
    input,
    "Platform settings saved.",
    "Couldn't save platform settings.",
    async ({ platformName, supportEmail }) => {
      await prisma.platformSettings.upsert({
        where: { id: DEFAULT_ID },
        create: { id: DEFAULT_ID, platformName, supportEmail },
        update: { platformName, supportEmail },
      });
    }
  );
}

export async function saveNotificationSettingsAction(input: unknown): Promise<SettingsActionResult> {
  return runSettingsAction(
    notificationSettingsSchema,
    input,
    "Notification preferences saved.",
    "Couldn't save notification preferences.",
    async (values) => {
      await prisma.platformSettings.upsert({
        where: { id: DEFAULT_ID },
        create: { ...ROW_DEFAULTS, ...values },
        update: values,
      });
    }
  );
}

export async function saveSecuritySettingsAction(input: unknown): Promise<SettingsActionResult> {
  return runSettingsAction(
    securitySettingsSchema,
    input,
    "Security settings saved.",
    "Couldn't save security settings.",
    async (values) => {
      await prisma.platformSettings.upsert({
        where: { id: DEFAULT_ID },
        create: { ...ROW_DEFAULTS, ...values },
        update: values,
      });
    }
  );
}
