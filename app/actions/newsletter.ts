"use server";

import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { env } from "@/lib/env";
import { confirmSubscriptionEmail, getEmailBaseUrl } from "@/lib/email-templates";
import { randomBytes } from "crypto";

const EMAIL_MAX_LENGTH = 320;

export type SubscribeResult =
  | { ok: true; message: "subscribed" }
  | { ok: true; message: "pending" }
  | { ok: true; message: "already_confirmed" }
  | { ok: false; error: string };

export async function subscribeNewsletter(email: string): Promise<SubscribeResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Please enter your email." };
  if (trimmed.length > EMAIL_MAX_LENGTH) return { ok: false, error: "Email is too long." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { ok: false, error: "Please enter a valid email." };

  const existing = await prisma.subscriber.findUnique({
    where: { email: trimmed },
    select: { status: true },
  });

  if (existing?.status === "Confirmed") {
    return { ok: true, message: "already_confirmed" };
  }
  if (existing?.status === "Pending") {
    return { ok: true, message: "pending" };
  }

  const token = randomBytes(32).toString("hex");
  const baseUrl = getEmailBaseUrl();
  const confirmUrl = `${baseUrl}/confirm-subscription?token=${token}`;

  if (existing?.status === "Unsubscribed") {
    await prisma.subscriber.update({
      where: { email: trimmed },
      data: {
        status: "Pending",
        token,
        confirmedAt: null,
        unsubscribedAt: null,
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.subscriber.create({
      data: {
        email: trimmed,
        status: "Pending",
        token,
      },
    });
  }

  try {
    const html = confirmSubscriptionEmail(confirmUrl);
    await resend.emails.send({
      from: env.EMAIL_FROM ?? "Edris LMS <onboarding@resend.dev>",
      to: [trimmed],
      subject: "Confirm your subscription — Edris LMS",
      html,
    });
  } catch (e) {
    console.error("Newsletter confirm email send failed:", e);
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
      token: randomBytes(32).toString("hex"),
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

export async function unsubscribeByEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Please enter your email." };

  const subscriber = await prisma.subscriber.findUnique({
    where: { email: trimmed },
  });
  if (!subscriber) return { ok: true };
  if (subscriber.status === "Unsubscribed") return { ok: true };

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
