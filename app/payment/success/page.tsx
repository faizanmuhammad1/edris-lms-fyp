import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { PaymentSuccessContent } from "./payment-success-content";

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

async function reconcileSuccessfulCheckout(
  sessionId: string,
  userId: string
): Promise<void> {
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  if (checkoutSession.payment_status !== "paid") {
    return;
  }

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

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { session_id } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let reconciled = false;

  if (session_id && session?.user.id) {
    try {
      await reconcileSuccessfulCheckout(session_id, session.user.id);
      reconciled = true;
    } catch (error) {
      console.error("Payment success reconciliation failed", error);
    }
  }

  return <PaymentSuccessContent reconciled={reconciled} />;
}
