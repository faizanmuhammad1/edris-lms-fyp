import { PrismaClient } from "../lib/generated/prisma";
import { env } from "../lib/env";

async function testConnection(url: string, name: string) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    console.log(`\n🔄 Testing ${name}...`);
    // Mask password in connection string
    console.log("📍 Connection string:", url.replace(/:[^:@]+@/, ":****@"));

    // Test connection by running a simple command
    // For MongoDB, we can use runCommandRaw or just a simple find/count
    try {
      await prisma.$runCommandRaw({ ping: 1 });
      console.log("✅ Database connection successful! (Ping)");
    } catch (e) {
      console.log("⚠️ Could not ping database via runCommandRaw, falling back to simple query check.");
    }

    // Test Prisma client initialization
    const userCount = await prisma.user.count();
    console.log(`📈 User table exists and has ${userCount} user(s)`);

    await prisma.$disconnect();
    console.log("✅ Connection closed successfully");
    return true;
  } catch (error: any) {
    console.error(`❌ ${name} failed!`);
    console.error("Error:", error.message);

    if (error.code === "P1001") {
      console.error("\n💡 This connection cannot reach the database server");
    } else if (error.code === "P1017") {
      console.error("\n💡 Database server closed the connection");
    }

    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  console.log("🔍 Testing Database Connection (MongoDB)\n");
  console.log("=".repeat(60));

  const currentUrl = env.DATABASE_URL;

  // Test current connection
  const currentSuccess = await testConnection(
    currentUrl,
    "MongoDB Connection"
  );


  if (currentSuccess) {
    process.exit(0);
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Check if your MongoDB cluster is active/reachable");
    console.log("   2. Verify your database password is correct");
    console.log("   3. Ensure your DATABASE_URL in .env is correct");
    console.log("   4. Ensure your IP is whitelisted in MongoDB Atlas or your provider");
    process.exit(1);
  }
}

main();
