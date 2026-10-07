import { z } from "zod";

/** Validation shared by the settings forms (client) and their server actions. */

export const SESSION_TIMEOUT_MIN = 5;
export const SESSION_TIMEOUT_MAX = 120;

export const platformSettingsSchema = z.object({
  platformName: z
    .string()
    .trim()
    .min(2, "Platform name must be at least 2 characters.")
    .max(100, "Platform name must be 100 characters or fewer."),
  supportEmail: z
    .string()
    .trim()
    .min(1, "Support email is required.")
    .max(254, "Support email is too long.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address, e.g. support@yourdomain.com."),
});

export const notificationSettingsSchema = z.object({
  notifyNewEnrollments: z.boolean(),
  notifyTeacherApplications: z.boolean(),
  notifySystemAlerts: z.boolean(),
});

export const securitySettingsSchema = z.object({
  sessionTimeoutEnabled: z.boolean(),
  sessionTimeoutMinutes: z
    .number({
      required_error: "Enter a number of minutes.",
      invalid_type_error: "Enter a number of minutes.",
    })
    .int("Use whole minutes.")
    .min(SESSION_TIMEOUT_MIN, `Must be at least ${SESSION_TIMEOUT_MIN} minutes.`)
    .max(SESSION_TIMEOUT_MAX, `Must be ${SESSION_TIMEOUT_MAX} minutes or fewer.`),
});

export type PlatformSettingsValues = z.infer<typeof platformSettingsSchema>;
export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
export type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;

export type SettingsActionResult = { status: "success" | "error"; message: string };
