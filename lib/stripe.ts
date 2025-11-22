import "server-only";

import Stripe from "stripe";
import { env } from "./env";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is required. Please add it to your environment variables."
  );
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
  typescript: true,
});
