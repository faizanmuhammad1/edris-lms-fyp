"use server";

import { prisma } from "@/lib/db";
import { MailAudienceType } from "@/lib/generated/prisma";
import { resend, DEFAULT_EMAIL_FROM, sendEmailOrThrow } from "@/lib/resend";
import { env } from "@/lib/env";
import { requireAdmin } from "@/app/data/admin/require-admin";
import {
  getRecipientsForAudience,
  getRecipientCount,
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
import { revalidatePath } from "next/cache";

const BATCH_SIZE = 100;
const DELAY_MS = 600;

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

export async function getRecipientCountAction(
  audienceType: string,
  audiencePayload?: AudiencePayload
): Promise<number> {
  await requireAdmin();
  return getRecipientCount(audienceType, audiencePayload);
}

export type SaveDraftResult = { ok: true; campaignId: string } | { ok: false; error: string };

export async function saveDraft(params: {
  campaignId?: string;
  subject: string;
  bodyJson: string;
  audienceType: string;
  audiencePayload?: AudiencePayload;
}): Promise<SaveDraftResult> {
  // Outside try/catch so Next's redirect for non-admins is not swallowed.
  const session = await requireAdmin();
  try {
    const userId = await getAdminUserId(session.user.email);
    const bodyHtml = tiptapJsonToHtml(params.bodyJson);

    if (params.campaignId) {
      const existing = await prisma.mailCampaign.findUnique({
        where: { id: params.campaignId },
        select: { sentAt: true, recipientCount: true },
      });
      if (!existing) return { ok: false, error: "Campaign not found." };
      // Once anyone has received it (fully or partially), content is locked so
      // a retry delivers the same email to the remaining recipients.
      if (existing.sentAt || existing.recipientCount > 0) {
        return { ok: false, error: "This campaign has already been sent and can no longer be edited." };
      }

      await prisma.mailCampaign.update({
        where: { id: params.campaignId },
        data: {
          subject: params.subject,
          bodyHtml,
          bodyJson: params.bodyJson,
          audienceType: toAudienceType(params.audienceType),
          audiencePayload: params.audiencePayload ?? undefined,
          updatedAt: new Date(),
        },
      });
      revalidatePath("/admin/mail");
      return { ok: true, campaignId: params.campaignId };
    }

    const campaign = await prisma.mailCampaign.create({
      data: {
        subject: params.subject,
        bodyHtml,
        bodyJson: params.bodyJson,
        audienceType: toAudienceType(params.audienceType),
        audiencePayload: params.audiencePayload ?? undefined,
        recipientCount: 0,
        createdById: userId,
      },
    });
    revalidatePath("/admin/mail");
    return { ok: true, campaignId: campaign.id };
  } catch (e) {
    console.error("saveDraft:", e);
    return { ok: false, error: "Failed to save draft." };
  }
}

export type SendPreviewResult = { ok: true } | { ok: false; error: string };

export async function sendPreview(params: {
  subject: string;
  bodyJson: string;
}): Promise<SendPreviewResult> {
  const session = await requireAdmin();
  try {
    const branding = await getEmailBranding();
    const html = previewCampaignEmail(tiptapJsonToHtml(params.bodyJson), branding);
    await sendEmailOrThrow({
      from: env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
      to: [session.user.email],
      subject: `[Preview] ${params.subject}`,
      html,
    });
    return { ok: true };
  } catch (e) {
    console.error("sendPreview:", e);
    return { ok: false, error: "Failed to send preview email." };
  }
}

export type SendCampaignResult =
  | { ok: true; sent: number }
  | { ok: false; error: string; partial?: number };

/**
 * Sends a campaign in batches. Only batches Resend accepted are recorded as
 * Sent MailRecipient rows (and counted). `sentAt` is set only once every
 * recipient has been sent, so a partially failed campaign can be sent again
 * and will skip recipients who already received it.
 */
export async function sendCampaign(params: {
  campaignId: string;
  subject: string;
  bodyJson: string;
  audienceType: string;
  audiencePayload?: AudiencePayload;
}): Promise<SendCampaignResult> {
  await requireAdmin();
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
      return { ok: false, error: "Campaign not found." };
    }
    if (campaign.sentAt) {
      return { ok: false, error: "This campaign has already been sent." };
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
      return { ok: false, error: "Subject is required." };
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
        return { ok: true, sent: 0 };
      }
      return { ok: false, error: "No recipients match this audience." };
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
      if (totalSent > 0) {
        return {
          ok: false,
          error: `Send partially failed: ${remaining} recipient${remaining === 1 ? "" : "s"} not sent. Send the campaign again to retry them.`,
          partial: totalSent,
        };
      }
      return { ok: false, error: "Failed to send emails." };
    }
    return { ok: true, sent };
  } catch (e) {
    console.error("sendCampaign:", e);
    return { ok: false, error: "Failed to send campaign." };
  }
}
