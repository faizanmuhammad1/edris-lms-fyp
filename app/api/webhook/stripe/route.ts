import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/checkout-fulfillment";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();

  const signature = headersList.get("Stripe-Signature");

  let event: Stripe.Event;

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe webhook secret not configured", {
      status: 500,
    });
  }

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
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

  // async_payment_succeeded covers delayed payment methods that are unpaid at completion.
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const fulfilled = await fulfillCheckoutSession(session);
      if (!fulfilled && session.payment_status === "paid") {
        console.error("Stripe webhook: paid session could not be fulfilled", session.id);
      }
    } catch (error) {
      console.error("Stripe webhook fulfillment failed:", error);
      // 500 lets Stripe retry transient failures (e.g. database unavailable).
      return new Response("Fulfillment failed", { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
