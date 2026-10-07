import "server-only";

import type Stripe from "stripe";
import { prisma } from "@/lib/db";

/** Stripe metadata values are capped at 500 chars, so enrollment ids are split across keys. */
const ENROLLMENT_IDS_PER_KEY = 12;
const ENROLLMENT_IDS_KEY = "enrollmentIds";

export function encodeEnrollmentIdsMetadata(ids: string[]): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (let i = 0; i * ENROLLMENT_IDS_PER_KEY < ids.length; i++) {
    const chunk = ids.slice(i * ENROLLMENT_IDS_PER_KEY, (i + 1) * ENROLLMENT_IDS_PER_KEY);
    metadata[i === 0 ? ENROLLMENT_IDS_KEY : `${ENROLLMENT_IDS_KEY}_${i}`] = chunk.join(",");
  }
  return metadata;
}

function decodeEnrollmentIdsMetadata(metadata: Stripe.Metadata | null): string[] {
  if (!metadata) return [];
  return Object.entries(metadata)
    .filter(([key]) => key === ENROLLMENT_IDS_KEY || key.startsWith(`${ENROLLMENT_IDS_KEY}_`))
    .flatMap(([, value]) => value.split(","))
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Activates the enrollments paid for by a Checkout Session. Idempotent, so it is
 * safe to call from both the Stripe webhook and the success-page reconciliation.
 * Returns false when the session is not paid or has no usable metadata.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== "paid") return false;

  const userId = session.metadata?.userId;
  if (!userId) return false;

  if (session.metadata?.type === "cart_checkout") {
    const enrollmentIds = decodeEnrollmentIdsMetadata(session.metadata);
    if (enrollmentIds.length === 0) return false;

    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds }, userId },
      select: { id: true, courseId: true },
    });

    await prisma.enrollment.updateMany({
      where: { id: { in: enrollments.map((e) => e.id) }, userId },
      data: { status: "Active" },
    });

    // Remove only the purchased courses; items added after checkout stay in the cart.
    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
        courseId: { in: enrollments.map((e) => e.courseId) },
      },
    });
    return true;
  }

  const enrollmentId = session.metadata?.enrollmentId;
  const courseId = session.metadata?.courseId;
  const amount = session.amount_total ?? undefined;

  if (enrollmentId) {
    const updated = await prisma.enrollment.updateMany({
      where: { id: enrollmentId, userId },
      data: { status: "Active", amount },
    });
    if (updated.count > 0) return true;
  }

  // The pending enrollment row is missing (e.g. deleted); the student still paid, so grant access.
  if (courseId) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: "Active", amount },
      create: { userId, courseId, status: "Active", amount: amount ?? 0 },
    });
    return true;
  }

  return false;
}
