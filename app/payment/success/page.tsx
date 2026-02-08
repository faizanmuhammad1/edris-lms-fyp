import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { PaymentSuccessContent } from "./payment-success-content";

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

const PAYMENT_POLL_ATTEMPTS = 5;
const PAYMENT_POLL_DELAY_MS = 1500;

async function getPaidCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  for (let attempt = 0; attempt < PAYMENT_POLL_ATTEMPTS; attempt++) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") return session;
    if (attempt < PAYMENT_POLL_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, PAYMENT_POLL_DELAY_MS));
    }
  }
  return null;
}

async function reconcileSuccessfulCheckout(
  sessionId: string,
  userId: string
): Promise<void> {
  const checkoutSession = await getPaidCheckoutSession(sessionId);
  if (!checkoutSession) return;

  const metadataUserId = checkoutSession.metadata?.userId;
  if (!metadataUserId || metadataUserId !== userId) {
    return;
  }

  const type = checkoutSession.metadata?.type;

  if (type === "cart_checkout") {
    const enrollmentIds = checkoutSession.metadata?.enrollmentIds
      ?.split(",")
      .filter(Boolean);

    if (!enrollmentIds?.length) {
      return;
    }

    await prisma.enrollment.updateMany({
      where: {
        id: { in: enrollmentIds },
        userId,
      },
      data: {
        status: "Active",
      },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (cart?.id) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
    }
  } else {
    const enrollmentId = checkoutSession.metadata?.enrollmentId;
    if (!enrollmentId) {
      return;
    }

    await prisma.enrollment.updateMany({
      where: {
        id: enrollmentId,
        userId,
      },
      data: {
        status: "Active",
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

/** Reconcile using only Stripe session (e.g. when auth cookie missing on redirect). */
async function reconcileFromSessionOnly(sessionId: string): Promise<boolean> {
  const checkoutSession = await getPaidCheckoutSession(sessionId);
  if (!checkoutSession) return false;

  const userId = checkoutSession.metadata?.userId;
  if (!userId) return false;

  const type = checkoutSession.metadata?.type;

  if (type === "cart_checkout") {
    const enrollmentIds = checkoutSession.metadata?.enrollmentIds
      ?.split(",")
      .filter(Boolean);
    if (!enrollmentIds?.length) return false;

    await prisma.enrollment.updateMany({
      where: {
        id: { in: enrollmentIds },
        userId,
      },
      data: {
        status: "Active",
      },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (cart?.id) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
    revalidatePath("/dashboard");
    revalidatePath("/courses");
    return true;
  }

  const enrollmentId = checkoutSession.metadata?.enrollmentId;
  if (!enrollmentId) return false;

  await prisma.enrollment.updateMany({
    where: {
      id: enrollmentId,
      userId,
    },
    data: {
      status: "Active",
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  return true;
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { session_id } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let reconciled = false;

  if (session_id) {
    try {
      if (session?.user.id) {
        await reconcileSuccessfulCheckout(session_id, session.user.id);
        reconciled = true;
      } else {
        // Auth cookie may be missing after Stripe redirect; reconcile using session_id only
        reconciled = await reconcileFromSessionOnly(session_id);
      }
    } catch (error) {
      console.error("Payment success reconciliation failed", error);
    }
  }

  return <PaymentSuccessContent reconciled={reconciled} />;
}
