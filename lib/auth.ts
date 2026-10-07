import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins";
import { DEFAULT_EMAIL_FROM, sendEmailOrThrow } from "./resend";
// import { admin } from "better-auth/plugins";

function normalizeOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const trustedOrigins = Array.from(
  new Set(
    [
      "https://edrislms.com",
      "https://www.edrislms.com",
      env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ]
      .map(normalizeOrigin)
      .filter((origin): origin is string => origin !== null)
  )
);

export const auth = betterAuth({
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Banned users cannot start new sessions (banUser also revokes existing ones).
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { banned: true, banExpires: true },
          });
          const banActive =
            user?.banned === true && (!user.banExpires || user.banExpires > new Date());
          if (banActive) {
            throw new APIError("FORBIDDEN", {
              message: "Your account has been suspended. Please contact support.",
            });
          }
        },
      },
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        // Throws on Resend API errors so the client is told the code was not sent.
        await sendEmailOrThrow({
          from: env.EMAIL_FROM || DEFAULT_EMAIL_FROM,
          to: [email],
          subject: "Edris LMS — Verify your email",
          html: `<p>Your Edris LMS verification code is <strong>${otp}</strong>.</p><p>It expires in 5 minutes. If you did not request it, you can ignore this email.</p>`,
        });
      },
    }),
    // admin(),
  ],
});
