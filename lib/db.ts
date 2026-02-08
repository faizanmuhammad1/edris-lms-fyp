import { PrismaClient } from "./generated/prisma";
import { env } from "./env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    // Configuration for connection pooling
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
