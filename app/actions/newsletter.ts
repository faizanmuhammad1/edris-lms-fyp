"use server";

import { prisma } from "@/lib/db";
import { DEFAULT_EMAIL_FROM, sendEmailOrThrow } from "@/lib/resend";
import { env } from "@/lib/env";
import {
  confirmSubscriptionEmail,
  getEmailBaseUrl,
  getEmailBranding,
  verifyUnsubscribeToken,
} from "@/lib/email-templates";
import { randomBytes, timingSafeEqual } from "crypto";

const EMAIL_MAX_LENGTH = 320;
/** Minimum gap between confirmation emails to the same address. */
const CONFIRMATION_COOLDOWN_MS = 5 * 60 * 1000;

export type SubscribeResult =
  | { ok: true; message: "subscribed" }
  | { ok: true; message: "pending" }
  | { ok: true; message: "already_confirmed" }
  | { ok: false; error: string };

function newToken(): string {
  return randomBytes(32).toString("hex");
}

function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2002";
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** True if a confirmation email went to this row within the cooldown window. */
function confirmationRecentlySent(row: {
  status: string;
  updatedAt: Date;
  unsubscribedAt: Date | null;
}): boolean {
  if (Date.now() - row.updatedAt.getTime() >= CONFIRMATION_COOLDOWN_MS) return false;
  if (row.status === "Pending") return true;
  // Unsubscribed rows: updatedAt also moves when the user unsubscribes, so only
  // count it if the row was touched (token rotated) after the unsubscribe.
  return row.unsubscribedAt == null || row.updatedAt.getTime() - row.unsubscribedAt.getTime() > 1000;
}

export async function subscribeNewsletter(email: string): Promise<SubscribeResult> {
  const trimmed = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!trimmed) return { ok: false, error: "Please enter your email." };
  if (trimmed.length > EMAIL_MAX_LENGTH) return { ok: false, error: "Email is too long." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { ok: false, error: "Please enter a valid email." };

  const existing = await prisma.subscriber.findUnique({
    where: { email: trimmed },
    select: { status: true, updatedAt: true, unsubscribedAt: true },
  });

  if (existing?.status === "Confirmed") {
    return { ok: true, message: "already_confirmed" };
  }
  // Abuse protection: at most one confirmation email per address per cooldown.
  if (existing && confirmationRecentlySent(existing)) {
    return { ok: true, message: "pending" };
  }

  // Fresh token for every send; older confirmation links stop working.
  const token = newToken();
  const confirmUrl = `${getEmailBaseUrl()}/confirm-subscription?token=${token}`;

  if (existing) {
    // Pending rows get a new link. Unsubscribed rows stay Unsubscribed until
    // the link is confirmed, so submitting someone else's address cannot opt
    // them back into campaigns.
    await prisma.subscriber.update({
      where: { email: trimmed },
      data: { token, updatedAt: new Date() },
    });
  } else {
    try {
      await prisma.subscriber.create({
        data: {
          email: trimmed,
          status: "Pending",
          token,
        },
      });
    } catch (e) {
      // A concurrent request just created this row and is sending the email.
      if (isUniqueConstraintError(e)) return { ok: true, message: "pending" };
      throw e;
    }
  }

  try {
    const branding = await getEmailBranding();
    await sendEmailOrThrow({
      from: env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
      to: [trimmed],
      subject: `Confirm your subscription — ${branding.platformName}`,
      html: confirmSubscriptionEmail(confirmUrl, branding),
    });
  } catch (e) {
    console.error("Newsletter confirm email send failed:", e);
    // Nothing was delivered: clear the cooldown so the user can retry now.
    await prisma.subscriber
      .updateMany({ where: { token }, data: { updatedAt: new Date(0) } })
      .catch((err) => console.error("Failed to reset subscribe cooldown:", err));
    return { ok: false, error: "Failed to send confirmation email. Please try again." };
  }

  return { ok: true, message: "subscribed" };
}

export async function confirmSubscription(token: string): Promise<{ ok: boolean; error?: string }> {
  if (!token?.trim()) return { ok: false, error: "Invalid link." };

  const subscriber = await prisma.subscriber.findUnique({
    where: { token: token.trim() },
  });
  if (!subscriber) return { ok: false, error: "Invalid or expired link." };
  if (subscriber.status === "Confirmed") return { ok: true };

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "Confirmed",
      confirmedAt: new Date(),
      unsubscribedAt: null,
      token: newToken(),
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function unsubscribeByToken(token: string): Promise<{ ok: boolean; error?: string }> {
  if (!token?.trim()) return { ok: false, error: "Invalid link." };

  const subscriber = await prisma.subscriber.findUnique({
    where: { token: token.trim() },
  });
  if (!subscriber) return { ok: false, error: "Invalid or expired link." };

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "Unsubscribed",
      unsubscribedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

/**
 * Unsubscribe an address from all marketing campaigns. Requires the signed
 * per-recipient token from a campaign email (or the address's existing
 * Subscriber token). Works for registered users with no Subscriber row by
 * creating an Unsubscribed row, which get-mail-recipients excludes.
 */
export async function unsubscribeByEmail(
  email: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = typeof email === "string" ? email.trim().toLowerCase() : "";
  const providedToken = typeof token === "string" ? token.trim() : "";
  if (!trimmed || !providedToken || trimmed.length > EMAIL_MAX_LENGTH) {
    return { ok: false, error: "Invalid link." };
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { email: trimmed },
    select: { id: true, status: true, token: true },
  });

  const isValid =
    verifyUnsubscribeToken(trimmed, providedToken) ||
    (subscriber != null && safeEqual(subscriber.token, providedToken));
  if (!isValid) return { ok: false, error: "Invalid or expired link." };

  if (subscriber?.status === "Unsubscribed") return { ok: true };

  const now = new Date();
  await prisma.subscriber.upsert({
    where: { email: trimmed },
    update: { status: "Unsubscribed", unsubscribedAt: now },
    create: {
      email: trimmed,
      status: "Unsubscribed",
      token: newToken(),
      unsubscribedAt: now,
    },
  });
  return { ok: true };
}
