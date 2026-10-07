"use server";

import { prisma } from "@/lib/db";
import { MailAudienceType } from "@/lib/generated/prisma";
import { resend, DEFAULT_EMAIL_FROM, sendEmailOrThrow } from "@/lib/resend";
import { env } from "@/lib/env";
import { requireAdmin } from "@/app/data/admin/require-admin";
import {
  getRecipientsForAudience,
  getRecipientCount,
  getUnsentRecipientCount,
} from "@/app/data/admin/get-mail-recipients";
import type { AudiencePayload } from "@/app/data/admin/get-mail-recipients";
import {
  buildOneClickUnsubscribeUrl,
  buildUnsubscribeUrl,
  campaignEmail,
  getEmailBranding,
  previewCampaignEmail,
} from "@/lib/email-templates";
import { tiptapJsonToHtml } from "@/lib/tiptap-json-to-html";
import { formatNumber, pluralize } from "@/app/admin/_lib/format";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

const BATCH_SIZE = 100;
const DELAY_MS = 600;
/** Keep in sync with the subject input's maxLength in ComposeForm. */
const SUBJECT_MAX_LENGTH = 255;

const VALID_AUDIENCE_TYPES: MailAudienceType[] = [
  MailAudienceType.Subscribers,
  MailAudienceType.AllStudents,
  MailAudienceType.CourseStudents,
  MailAudienceType.AllTeachers,
  MailAudienceType.CategoryStudents,
  MailAudienceType.LevelStudents,
  MailAudienceType.Manual,
];

function toAudienceType(value: string): MailAudienceType {
  if (VALID_AUDIENCE_TYPES.includes(value as MailAudienceType)) return value as MailAudienceType;
  return MailAudienceType.Subscribers;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAdminUserId(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) throw new Error("Admin user not found");
  return user.id;
}

// ── Results & validation ─────────────────────────────────────────────────────

type ActionError = { status: "error"; message: string };

/** Every action resolves to a result the UI can show; none throw to the client. */
export type MailActionResult<T extends object = Record<never, never>> =
  | ({ status: "success"; message: string } & T)
  | ActionError;

export type RecipientCountResult = MailActionResult<{ count: number }>;
export type SaveDraftResult = MailActionResult<{ campaignId: string }>;
export type SendPreviewResult = MailActionResult;
export type CampaignPreviewResult = MailActionResult<{ subject: string; html: string }>;
export type SendCampaignResult =
  | { status: "success"; message: string; sent: number }
  | {
      status: "error";
      message: string;
      /** Present when some recipients received the campaign before the send stopped. */
      partial?: { sent: number; total: number; unsent: number };
    };

const audienceTypeSchema = z.nativeEnum(MailAudienceType, {
  errorMap: () => ({ message: "Choose a valid audience." }),
});

const audiencePayloadSchema = z
  .object({
    courseId: z.string().max(100).optional(),
    category: z.string().max(200).optional(),
    level: z.string().max(50).optional(),
    emails: z.array(z.string().max(320)).max(5000, "Too many email addresses.").optional(),
  })
  .optional();

const campaignIdSchema = z.string().min(1, "Campaign not found.").max(100);

const bodyJsonSchema = z.string().refine((value) => {
  if (value === "") return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}, "The message body could not be read. Reload the page and try again.");

const subjectSchema = z
  .string()
  .max(SUBJECT_MAX_LENGTH, `Keep the subject under ${SUBJECT_MAX_LENGTH} characters.`);

const saveDraftSchema = z.object({
  campaignId: campaignIdSchema.optional(),
  subject: subjectSchema.refine((s) => s.trim().length > 0, "Add a subject before saving."),
  bodyJson: bodyJsonSchema,
  audienceType: audienceTypeSchema,
  audiencePayload: audiencePayloadSchema,
});

const sendCampaignSchema = z.object({
  campaignId: campaignIdSchema,
  subject: subjectSchema,
  bodyJson: bodyJsonSchema,
  audienceType: audienceTypeSchema,
  audiencePayload: audiencePayloadSchema,
});

const previewSchema = z.object({
  campaignId: campaignIdSchema.optional(),
  subject: subjectSchema,
  bodyJson: bodyJsonSchema,
});

function invalid(error: z.ZodError): ActionError {
  return { status: "error", message: error.issues[0]?.message ?? "Invalid request." };
}

/** Logs an unexpected failure; lets Next's redirect/notFound errors propagate. */
function failure(scope: string, error: unknown, message: string): ActionError {
  unstable_rethrow(error);
  console.error(`${scope}:`, error);
  return { status: "error", message };
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function getRecipientCountAction(
  audienceType: string,
  audiencePayload?: AudiencePayload
): Promise<RecipientCountResult> {
  await requireAdmin();
  const parsed = z
    .object({ audienceType: audienceTypeSchema, audiencePayload: audiencePayloadSchema })
    .safeParse({ audienceType, audiencePayload });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const count = await getRecipientCount(parsed.data.audienceType, parsed.data.audiencePayload);
    return { status: "success", message: `${pluralize(count, "recipient")} match.`, count };
  } catch (e) {
    return failure("getRecipientCountAction", e, "Couldn't count recipients. Try again.");
  }
}

/** Recipients a resend of a partially sent campaign would still reach. */
export async function getUnsentRecipientCountAction(
  campaignId: string
): Promise<RecipientCountResult> {
  await requireAdmin();
  const parsed = campaignIdSchema.safeParse(campaignId);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const count = await getUnsentRecipientCount(parsed.data);
    if (count === null) return { status: "error", message: "Campaign not found." };
    return {
      status: "success",
      message: `${pluralize(count, "recipient")} haven't received it yet.`,
      count,
    };
  } catch (e) {
    return failure("getUnsentRecipientCountAction", e, "Couldn't count unsent recipients. Try again.");
  }
}

export async function saveDraft(params: {
  campaignId?: string;
  subject: string;
  bodyJson: string;
  audienceType: string;
  audiencePayload?: AudiencePayload;
}): Promise<SaveDraftResult> {
  // Outside try/catch so Next's redirect for non-admins is not swallowed.
  const session = await requireAdmin();
  const parsed = saveDraftSchema.safeParse(params);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  try {
    const userId = await getAdminUserId(session.user.email);
    const bodyHtml = tiptapJsonToHtml(input.bodyJson);

    if (input.campaignId) {
      const existing = await prisma.mailCampaign.findUnique({
        where: { id: input.campaignId },
        select: { sentAt: true, recipientCount: true },
      });
      if (!existing) return { status: "error", message: "Campaign not found." };
      // Once anyone has received it (fully or partially), content is locked so
      // a retry delivers the same email to the remaining recipients.
      if (existing.sentAt || existing.recipientCount > 0) {
        return {
          status: "error",
          message: "This campaign has already been sent and can no longer be edited.",
        };
      }

      await prisma.mailCampaign.update({
        where: { id: input.campaignId },
        data: {
          subject: input.subject,
          bodyHtml,
          bodyJson: input.bodyJson,
          audienceType: toAudienceType(input.audienceType),
          audiencePayload: input.audiencePayload ?? undefined,
          updatedAt: new Date(),
        },
      });
      revalidatePath("/admin/mail");
      return { status: "success", message: "Draft saved.", campaignId: input.campaignId };
    }

    const campaign = await prisma.mailCampaign.create({
      data: {
        subject: input.subject,
        bodyHtml,
        bodyJson: input.bodyJson,
        audienceType: toAudienceType(input.audienceType),
        audiencePayload: input.audiencePayload ?? undefined,
        recipientCount: 0,
        createdById: userId,
      },
    });
    revalidatePath("/admin/mail");
    return { status: "success", message: "Draft saved.", campaignId: campaign.id };
  } catch (e) {
    return failure("saveDraft", e, "Couldn't save the draft. Try again.");
  }
}

/** Emails a preview of the current content to the signed-in admin only. */
export async function sendPreview(params: {
  subject: string;
  bodyJson: string;
}): Promise<SendPreviewResult> {
  const session = await requireAdmin();
  const parsed = previewSchema.safeParse(params);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const branding = await getEmailBranding();
    const html = previewCampaignEmail(tiptapJsonToHtml(parsed.data.bodyJson), branding);
    await sendEmailOrThrow({
      from: env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
      to: [session.user.email],
      subject: `[Preview] ${parsed.data.subject}`,
      html,
    });
    return { status: "success", message: `Test email sent to ${session.user.email}.` };
  } catch (e) {
    return failure("sendPreview", e, "Couldn't send the test email. Try again.");
  }
}

/**
 * Renders the campaign email for the in-app preview (nothing is sent). Once a
 * campaign has been (partially) sent, the stored subject/body are shown because
 * that is exactly what recipients receive.
 */
export async function getCampaignPreview(params: {
  campaignId?: string;
  subject: string;
  bodyJson: string;
}): Promise<CampaignPreviewResult> {
  await requireAdmin();
  const parsed = previewSchema.safeParse(params);
  if (!parsed.success) return invalid(parsed.error);

  try {
    let subject = parsed.data.subject;
    let bodyHtml: string | null = null;
    if (parsed.data.campaignId) {
      const campaign = await prisma.mailCampaign.findUnique({
        where: { id: parsed.data.campaignId },
        select: { subject: true, bodyHtml: true, sentAt: true, recipientCount: true },
      });
      if (campaign && (campaign.sentAt || campaign.recipientCount > 0)) {
        subject = campaign.subject;
        bodyHtml = campaign.bodyHtml;
      }
    }
    const branding = await getEmailBranding();
    // "#" stands in for the per-recipient unsubscribe link; no token is generated.
    const html = campaignEmail(bodyHtml ?? tiptapJsonToHtml(parsed.data.bodyJson), "#", branding);
    return { status: "success", message: "Preview ready.", subject, html };
  } catch (e) {
    return failure("getCampaignPreview", e, "Couldn't render the preview. Try again.");
  }
}

/**
 * Sends a campaign in batches. Only batches Resend accepted are recorded as
 * Sent MailRecipient rows (and counted). `sentAt` is set only once every
 * recipient has been sent, so a partially failed campaign can be sent again
 * and will skip recipients who already received it.
 */
export async function sendCampaign(rawParams: {
  campaignId: string;
  subject: string;
  bodyJson: string;
  audienceType: string;
  audiencePayload?: AudiencePayload;
}): Promise<SendCampaignResult> {
  await requireAdmin();
  const parsed = sendCampaignSchema.safeParse(rawParams);
  if (!parsed.success) return invalid(parsed.error);
  const params = parsed.data;

  try {
    const campaign = await prisma.mailCampaign.findUnique({
      where: { id: params.campaignId },
      select: {
        id: true,
        sentAt: true,
        subject: true,
        bodyHtml: true,
        audienceType: true,
        audiencePayload: true,
      },
    });
    if (!campaign) {
      return { status: "error", message: "Campaign not found." };
    }
    if (campaign.sentAt) {
      return { status: "error", message: "This campaign has already been sent." };
    }

    // Recipients delivered by an earlier, partially failed attempt.
    const previouslySent = await prisma.mailRecipient.findMany({
      where: { mailCampaignId: campaign.id, status: "Sent" },
      select: { email: true },
    });
    const alreadySent = new Set(previouslySent.map((r) => r.email.toLowerCase()));
    const isRetry = alreadySent.size > 0;

    // A retry re-uses the stored content/audience so everyone gets the same email.
    const subject = isRetry ? campaign.subject : params.subject;
    const bodyHtml = isRetry ? campaign.bodyHtml : tiptapJsonToHtml(params.bodyJson);
    const audienceType = isRetry ? campaign.audienceType : toAudienceType(params.audienceType);
    const audiencePayload = isRetry
      ? ((campaign.audiencePayload as AudiencePayload | null) ?? undefined)
      : params.audiencePayload;

    if (!subject.trim()) {
      return { status: "error", message: "Subject is required." };
    }

    const recipients = (await getRecipientsForAudience(audienceType, audiencePayload)).filter(
      (r) => !alreadySent.has(r.email.toLowerCase())
    );

    if (recipients.length === 0) {
      if (isRetry) {
        await prisma.mailCampaign.update({
          where: { id: campaign.id },
          data: { sentAt: new Date() },
        });
        revalidatePath("/admin/mail");
        return {
          status: "success",
          message: "Everyone in this audience has already received it. The campaign is now marked as sent.",
          sent: 0,
        };
      }
      return { status: "error", message: "No recipients match this audience." };
    }

    if (!isRetry) {
      // Persist exactly what is being sent (used for retries and the "View" page).
      await prisma.mailCampaign.update({
        where: { id: campaign.id },
        data: {
          subject,
          bodyHtml,
          bodyJson: params.bodyJson,
          audienceType,
          audiencePayload: params.audiencePayload ?? undefined,
        },
      });
    }

    const from = env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
    const branding = await getEmailBranding();
    let sent = 0;
    let failed = false;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);

      const emailsToSend = chunk.map((r) => ({
        from,
        to: r.email,
        subject,
        html: campaignEmail(bodyHtml, buildUnsubscribeUrl(r.email), branding),
        headers: {
          "List-Unsubscribe": `<${buildOneClickUnsubscribeUrl(r.email)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }));

      // resend.batch.send() returns { error } on API failures instead of throwing.
      let batchError: unknown = null;
      try {
        const { error } = await resend.batch.send(emailsToSend);
        batchError = error;
      } catch (e) {
        batchError = e;
      }
      if (batchError) {
        console.error("sendCampaign batch error:", batchError);
        failed = true;
        break;
      }

      // Record only recipients Resend accepted; keep recipientCount in step so
      // progress survives a timeout mid-send.
      await prisma.$transaction([
        prisma.mailRecipient.createMany({
          data: chunk.map((r) => ({
            mailCampaignId: campaign.id,
            email: r.email,
            userId: r.userId ?? undefined,
            subscriberId: r.subscriberId ?? undefined,
          })),
        }),
        prisma.mailCampaign.update({
          where: { id: campaign.id },
          data: { recipientCount: { increment: chunk.length } },
        }),
      ]);
      sent += chunk.length;

      if (i + BATCH_SIZE < recipients.length) {
        await sleep(DELAY_MS);
      }
    }

    if (!failed) {
      await prisma.mailCampaign.update({
        where: { id: campaign.id },
        data: { sentAt: new Date() },
      });
    }
    revalidatePath("/admin/mail");

    if (failed) {
      const totalSent = alreadySent.size + sent;
      const remaining = recipients.length - sent;
      const total = alreadySent.size + recipients.length;
      if (totalSent > 0) {
        return {
          status: "error",
          message: `Sent to ${formatNumber(totalSent)} of ${formatNumber(total)} recipients; ${formatNumber(remaining)} ${remaining === 1 ? "wasn't" : "weren't"} sent. You can retry the unsent recipients from the campaign page.`,
          partial: { sent: totalSent, total, unsent: remaining },
        };
      }
      return {
        status: "error",
        message: "The email service rejected the send, so no emails went out. Try again in a few minutes.",
      };
    }
    return {
      status: "success",
      message: isRetry
        ? `Sent to the remaining ${pluralize(sent, "recipient")}. The campaign is now fully sent.`
        : `Campaign sent to ${pluralize(sent, "recipient")}.`,
      sent,
    };
  } catch (e) {
    return failure(
      "sendCampaign",
      e,
      "Sending stopped unexpectedly. Open the campaign to check how many recipients received it before retrying."
    );
  }
}
