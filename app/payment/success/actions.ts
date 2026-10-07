import "server-only";

import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/checkout-fulfillment";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

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

/**
 * Activates the purchase on the success page in case the webhook hasn't arrived yet.
 * Runs on the server during page render, so the page reflects the real outcome.
 */
export async function reconcileCheckout(sessionId: string): Promise<boolean> {
    if (!sessionId.startsWith("cs_")) return false;
    try {
        const checkoutSession = await getPaidCheckoutSession(sessionId);
        if (!checkoutSession) return false;

        const fulfilled = await fulfillCheckoutSession(checkoutSession);
        if (fulfilled) {
            revalidatePath("/dashboard");
            revalidatePath("/courses");
        }
        return fulfilled;
    } catch (error) {
        console.error("Payment success reconciliation failed", error);
        return false;
    }
}
