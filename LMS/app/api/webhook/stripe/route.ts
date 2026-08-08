import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();

  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe webhook secret not configured", {
      status: 500,
    });
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new Response("Webhook error", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const type = session.metadata?.type;

    if (type === "cart_checkout") {
      // Handle Cart Checkout
      const enrollmentIds = session.metadata?.enrollmentIds?.split(",") || [];
      const userId = session.metadata?.userId;

      if (enrollmentIds.length > 0) {
        await prisma.enrollment.updateMany({
          where: {
            id: { in: enrollmentIds }
          },
          data: {
            status: "Active",
          }
        });
      }

      // Clear Cart
      if (userId) {
        const cart = await prisma.cart.findUnique({
          where: { userId: userId },
        });
        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
      }

    } else {
      // Handle Single Course Checkout
      const courseId = session.metadata?.courseId;
      const customerId = session.customer as string;

      if (!courseId) {
        throw new Error("Course id not found...");
      }

      const user = await prisma.user.findFirst({
        where: {
          stripeCustomerId: customerId,
        },
      });

      if (!user) {
        throw new Error("User not found...");
      }

      await prisma.enrollment.update({
        where: {
          id: session.metadata?.enrollmentId as string,
        },
        data: {
          userId: user.id,
          courseId: courseId,
          amount: session.amount_total as number,
          status: "Active",
        },
      });
    }
  }

  return new Response(null, { status: 200 });
}
