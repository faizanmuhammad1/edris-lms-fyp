import type { AudiencePayload } from "@/app/data/admin/get-mail-recipients";
import type { BadgeTone } from "@/app/admin/_components/StatusBadge";
import { pluralize } from "@/app/admin/_lib/format";

/**
 * Campaign lifecycle, derived the same way the send/save actions do:
 * - `sent`: `sentAt` is set only once every recipient has been sent.
 * - `partial`: not marked sent, but at least one batch was accepted
 *   (`recipientCount` is incremented together with the Sent MailRecipient rows).
 *   Content is locked and a resend only targets recipients who have not received it.
 * - `draft`: nobody has received it yet; still editable.
 */
export type CampaignStatus = "draft" | "partial" | "sent";

export function getCampaignStatus(campaign: {
  sentAt: Date | string | null;
  recipientCount: number;
}): CampaignStatus {
  if (campaign.sentAt) return "sent";
  return campaign.recipientCount > 0 ? "partial" : "draft";
}

export const CAMPAIGN_STATUS_META: Record<
  CampaignStatus,
  { label: string; tone: BadgeTone; description: string }
> = {
  draft: { label: "Draft", tone: "neutral", description: "Not sent yet" },
  partial: {
    label: "Partially sent",
    tone: "warning",
    description: "Some recipients haven't received it yet",
  },
  sent: { label: "Sent", tone: "success", description: "Sent to every recipient" },
};

export type AudienceType =
  | "Subscribers"
  | "AllStudents"
  | "CourseStudents"
  | "AllTeachers"
  | "CategoryStudents"
  | "LevelStudents"
  | "Manual";

export const AUDIENCE_OPTIONS: { value: AudienceType; label: string; description: string }[] = [
  {
    value: "Subscribers",
    label: "Newsletter subscribers",
    description: "Everyone who confirmed their newsletter subscription.",
  },
  {
    value: "AllStudents",
    label: "All students",
    description: "Everyone with at least one active course enrollment.",
  },
  {
    value: "CourseStudents",
    label: "Students of a course",
    description: "Students actively enrolled in one published course.",
  },
  {
    value: "CategoryStudents",
    label: "Students in a category",
    description: "Students enrolled in any course in a category.",
  },
  {
    value: "LevelStudents",
    label: "Students by level",
    description: "Students enrolled in Beginner, Intermediate or Advanced courses.",
  },
  {
    value: "AllTeachers",
    label: "All teachers",
    description: "Teacher accounts and approved teacher applicants.",
  },
  {
    value: "Manual",
    label: "Specific email addresses",
    description: "Only the addresses you enter.",
  },
];

export const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const;

export function audienceLabel(type: string): string {
  return AUDIENCE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/** Reads a stored `audiencePayload` JSON value defensively. */
export function toAudiencePayload(value: unknown): AudiencePayload | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const v = value as Record<string, unknown>;
  return {
    courseId: typeof v.courseId === "string" ? v.courseId : undefined,
    category: typeof v.category === "string" ? v.category : undefined,
    level: typeof v.level === "string" ? v.level : undefined,
    emails: Array.isArray(v.emails)
      ? v.emails.filter((e): e is string => typeof e === "string")
      : undefined,
  };
}

/** Human summary of who a campaign targets, e.g. "Students of Intro to React". */
export function describeAudience(
  type: string,
  payload: AudiencePayload | undefined,
  courseTitle?: string | null
): string {
  switch (type) {
    case "CourseStudents":
      return payload?.courseId
        ? `Students of ${courseTitle ?? "a course that is no longer available"}`
        : "Students of a course";
    case "CategoryStudents":
      return payload?.category ? `Students in ${payload.category}` : "Students in a category";
    case "LevelStudents":
      return payload?.level ? `${payload.level} students` : "Students by level";
    case "Manual": {
      const count = payload?.emails?.length ?? 0;
      return count > 0
        ? pluralize(count, "specific address", "specific addresses")
        : "Specific email addresses";
    }
    default:
      return audienceLabel(type);
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Splits the manual-recipients textarea into unique valid addresses (lowercased,
 * same rule the server applies) and the entries that are not valid emails.
 */
export function parseManualEmails(text: string): { valid: string[]; invalid: string[] } {
  const entries = text
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  const valid = new Set<string>();
  const invalid = new Set<string>();
  for (const entry of entries) {
    const normalized = entry.toLowerCase();
    if (EMAIL_PATTERN.test(normalized)) valid.add(normalized);
    else invalid.add(entry);
  }
  return { valid: Array.from(valid), invalid: Array.from(invalid) };
}

/** True when TipTap JSON contains visible content (text, a rule or an image). */
export function hasBodyContent(bodyJson: string): boolean {
  if (!bodyJson.trim()) return false;
  const visit = (node: unknown): boolean => {
    if (!node || typeof node !== "object") return false;
    const n = node as { type?: unknown; text?: unknown; content?: unknown };
    if (n.type === "text") return typeof n.text === "string" && n.text.trim().length > 0;
    if (n.type === "horizontalRule" || n.type === "image") return true;
    return Array.isArray(n.content) && n.content.some(visit);
  };
  try {
    return visit(JSON.parse(bodyJson));
  } catch {
    return false;
  }
}
