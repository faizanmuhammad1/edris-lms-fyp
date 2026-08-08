"use server";

import { prisma } from "@/lib/db";
import { MailAudienceType } from "@/lib/generated/prisma";
import { resend } from "@/lib/resend";
import { env } from "@/lib/env";
import { requireAdmin } from "@/app/data/admin/require-admin";
import {
  getRecipientsForAudience,
  getRecipientCount,
} from "@/app/data/admin/get-mail-recipients";
import type { AudiencePayload } from "@/app/data/admin/get-mail-recipients";
import {
  campaignEmail,
  getEmailBaseUrl,
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

async function getAdminUserId(): Promise<string> {
  const session = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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
  try {
    const userId = await getAdminUserId();
    const bodyHtml = tiptapJsonToHtml(params.bodyJson);

    if (params.campaignId) {
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
  try {
    const session = await requireAdmin();
    const html = previewCampaignEmail(tiptapJsonToHtml(params.bodyJson));
    await resend.emails.send({
      from: env.EMAIL_FROM ?? "Edris LMS <onboarding@resend.dev>",
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

export async function sendCampaign(params: {
  campaignId: string;
  subject: string;
  bodyJson: string;
  audienceType: string;
  audiencePayload?: AudiencePayload;
}): Promise<SendCampaignResult> {
  try {
    const userId = await getAdminUserId();
    const recipients = await getRecipientsForAudience(params.audienceType, params.audiencePayload);
    if (recipients.length === 0) {
      return { ok: false, error: "No recipients match this audience." };
    }

    const bodyHtml = tiptapJsonToHtml(params.bodyJson);
    const baseUrl = getEmailBaseUrl();

    const campaign = await prisma.mailCampaign.findUnique({
      where: { id: params.campaignId },
      select: { id: true, createdById: true },
    });
    if (!campaign || campaign.createdById !== userId) {
      return { ok: false, error: "Campaign not found or access denied." };
    }

    const from = env.EMAIL_FROM ?? "Edris LMS <onboarding@resend.dev>";
    let sent = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const subIds = chunk.map((r) => r.subscriberId).filter(Boolean) as string[];
      const subscriberTokens =
        subIds.length > 0
          ? await prisma.subscriber.findMany({
              where: { id: { in: subIds } },
              select: { id: true, token: true },
            })
          : [];
      const tokenBySubId = new Map(subscriberTokens.map((s) => [s.id, s.token]));

      const emailsToSend = chunk.map((r) => {
        const unsubscribeUrl =
          r.subscriberId != null
            ? `${baseUrl}/unsubscribe?token=${tokenBySubId.get(r.subscriberId) ?? ""}`
            : `${baseUrl}/unsubscribe`;
        const html = campaignEmail(bodyHtml, unsubscribeUrl);
        return {
          from,
          to: r.email,
          subject: params.subject,
          html,
        };
      });

      try {
        await resend.batch.send(emailsToSend);
        sent += chunk.length;

        await prisma.mailRecipient.createMany({
          data: chunk.map((r) => ({
            mailCampaignId: params.campaignId,
            email: r.email,
            userId: r.userId ?? undefined,
            subscriberId: r.subscriberId ?? undefined,
          })),
        });
      } catch (batchError) {
        console.error("sendCampaign batch error:", batchError);
        if (sent > 0) {
          await prisma.mailCampaign.update({
            where: { id: params.campaignId },
            data: { recipientCount: sent, sentAt: new Date() },
          });
          revalidatePath("/admin/mail");
          return { ok: false, error: "Send partially failed.", partial: sent };
        }
        return { ok: false, error: "Failed to send emails." };
      }

      if (i + BATCH_SIZE < recipients.length) {
        await sleep(DELAY_MS);
      }
    }

    await prisma.mailCampaign.update({
      where: { id: params.campaignId },
      data: { subject: params.subject, bodyHtml, bodyJson: params.bodyJson, recipientCount: sent, sentAt: new Date() },
    });
    revalidatePath("/admin/mail");
    return { ok: true, sent };
  } catch (e) {
    console.error("sendCampaign:", e);
    return { ok: false, error: "Failed to send campaign." };
  }
}
