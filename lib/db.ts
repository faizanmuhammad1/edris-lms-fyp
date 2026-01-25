import { PrismaClient } from "./generated/prisma";
import { env } from "./env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

console.log("DEBUG: Initializing Prisma Client...");
console.log("DEBUG: env.DATABASE_URL type:", typeof env.DATABASE_URL);
if (env.DATABASE_URL) {
  console.log("DEBUG: env.DATABASE_URL starts with:", env.DATABASE_URL.substring(0, 15));
} else {
  console.error("DEBUG: env.DATABASE_URL is UNDEFINED or EMPTY!");
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
