
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking DB connection...");
    try {
        const userCount = await prisma.user.count();
        console.log(`Connection successful! User count: ${userCount}`);

        // Check session table if possible (since error was prisma.session.findMany)
        const sessionCount = await prisma.session.count();
        console.log(`Session count: ${sessionCount}`);

    } catch (error) {
        console.error("DB Connection failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
