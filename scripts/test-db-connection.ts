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

    // Test connection by running a simple query
    // For PostgreSQL, we use $queryRaw to test the connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Database connection successful! (SELECT 1)");
    } catch (e) {
      console.log("⚠️ Could not ping database, falling back to simple query check.");
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
  console.log("🔍 Testing Database Connection (PostgreSQL)\n");
  console.log("=".repeat(60));

  const currentUrl = env.DATABASE_URL;

  // Test current connection
  const currentSuccess = await testConnection(
    currentUrl,
    "PostgreSQL Connection"
  );


  if (currentSuccess) {
    process.exit(0);
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Check if your PostgreSQL server is active/reachable");
    console.log("   2. Verify your database password is correct");
    console.log("   3. Ensure your DATABASE_URL in .env is correct");
    console.log("   4. Ensure your IP is whitelisted if using a cloud provider");
    process.exit(1);
  }
}

main();
