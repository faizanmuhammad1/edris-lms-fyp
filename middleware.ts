import { NextRequest, NextResponse } from "next/server";
import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { env } from "@/lib/env";

// Configure Arcjet
const aj = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    detectBot({
      mode: process.env.NODE_ENV === "development" ? "DRY_RUN" : "LIVE", // DRY_RUN in dev to reduce warnings, LIVE in production
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:MONITOR",
        "CATEGORY:PREVIEW",
        "STRIPE_WEBHOOK",

        // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
  ],
});

// Your existing authentication middleware
// Note: Using direct cookie access instead of better-auth/cookies to avoid Edge Runtime dynamic code evaluation
async function authMiddleware(request: NextRequest) {
  // Check for better-auth session cookie directly (Edge Runtime compatible)
  // The cookie name is typically "better-auth.session_token" or similar
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session") ||
    request.cookies.get("__Secure-better-auth.session") ||
    request.cookies.get("session") ||
    request.cookies.get("__Secure-session");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets, but auth check only on admin routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks/mux).*)"],
};

// Combine Arcjet with your existing middleware
export default createMiddleware(aj, async (request: NextRequest) => {
  // Only apply auth middleware to admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return authMiddleware(request);
  }

  // For non-admin routes, just continue
  return NextResponse.next();
});
