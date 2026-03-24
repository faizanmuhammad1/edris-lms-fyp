import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().min(1),
    BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_ENDPOINT_URL_S3: z.string().url().optional(),
    AWS_REGION: z.string().min(1),
    EMAIL_FROM: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    MUX_TOKEN_ID: z.string().min(1),
    MUX_TOKEN_SECRET: z.string().min(1),
    MUX_WEBHOOK_SECRET: z.string().min(1),
    MUX_SIGNING_KEY_ID: z.string().min(1),
    MUX_SIGNING_PRIVATE_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    INTERNAL_WEBHOOK_URL: z.string().url().optional(),

    // Polygon blockchain (Certificate issuance + verification)
    POLYGON_RPC_URL: z.string().min(1),
    BLOCKCHAIN_PRIVATE_KEY: z.string().min(1),
    CONTRACT_ADDRESS: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().min(1),
    NEXT_PUBLIC_AWS_REGION: z.string().min(1).optional().default("eu-west-2"),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),

    NEXT_PUBLIC_BLOCK_EXPLORER: z
      .string()
      .optional()
      .default("https://amoy.polygonscan.com"),
  },

  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BLOCK_EXPLORER: process.env.NEXT_PUBLIC_BLOCK_EXPLORER,
  },
});
