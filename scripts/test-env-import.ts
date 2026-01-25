
import fs from "fs";
import path from "path";


const envFiles = [".env", ".env.local"];

envFiles.forEach(file => {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const rawValue = match[2].split("#")[0].trim();
                const value = rawValue.replace(/^["']|["']$/g, "");
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
});

// import { env } from "../lib/env";
// import { prisma } from "../lib/db";

async function main() {
    const { env } = await import("../lib/env");
    const { prisma } = await import("../lib/db");

    console.log("--------------- DEBUG ---------------");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("env.DATABASE_URL:", env.DATABASE_URL);

    try {
        const count = await prisma.user.count();
        console.log("User count:", count);
    } catch (e) {
        console.error("Prisma error:", e);
    }
}

main().catch(console.error);
