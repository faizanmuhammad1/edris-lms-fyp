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
    console.log("📍 Connection string:", url.replace(/:[^:@]+@/, ":****@"));
    
    // Test connection by running a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful!");
    console.log("📊 Test query result:", result);
    
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
  console.log("🔍 Testing Database Connection\n");
  console.log("=".repeat(60));
  
  const currentUrl = env.DATABASE_URL;
  const isPooler = currentUrl.includes(":6543") || currentUrl.includes("pgbouncer=true");
  
  // Test current connection
  const currentSuccess = await testConnection(
    currentUrl,
    isPooler ? "Session Pooler Connection" : "Direct Connection"
  );
  
  // If direct connection failed and not using pooler, suggest pooler URL
  if (!currentSuccess && !isPooler) {
    console.log("\n" + "=".repeat(60));
    console.log("\n💡 Suggestion: Try using Session Pooler connection");
    
    // Generate pooler URL from current URL
    // Fix common issues with pooler connection strings
    let poolerUrl = currentUrl
      .replace(":5432/", ":6543/")
      .replace(/\/\/postgres\.khjlugjfpwddnugbfpdk@/, "//postgres:") // Fix username format
      .replace(/\/\/postgres\.([^.]+)\.([^.]+)\.([^@]+)@/, "//postgres@") // Fix username format
      .replace(/@aws-[^-]+-ap-[^-]+-(\d+)\.pooler\.supabase\.com/, "@db.khjlugjfpwddnugbfpdk.supabase.co") // Fix host format
      .replace(/\?.*$/, ""); // Remove existing query params
    
    // Add pooler query parameters if not present
    if (!poolerUrl.includes("pgbouncer=true")) {
      poolerUrl += "?pgbouncer=true&connection_limit=1";
    }
    
    console.log("\n📝 Update your .env file with this connection string:");
    console.log(`DATABASE_URL="${poolerUrl}"\n`);
    
    // Ask if user wants to test pooler connection
    const testPooler = await testConnection(poolerUrl, "Session Pooler Connection (Suggested)");
    
    if (testPooler) {
      console.log("\n✅ Session Pooler connection works! Update your .env file.");
      process.exit(0);
    }
  }
  
  if (currentSuccess) {
    process.exit(0);
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Check if your Supabase project is paused");
    console.log("   2. Verify your database password is correct");
    console.log("   3. Ensure your DATABASE_URL in .env is correct");
    console.log("   4. If on IPv4-only network, use Session Pooler (port 6543)");
    console.log("   5. Check Supabase dashboard for connection issues");
    process.exit(1);
  }
}

main();
