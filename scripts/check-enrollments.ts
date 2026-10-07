import { PrismaClient } from "../lib/generated/prisma";
import { env } from "../lib/env";
import * as fs from 'fs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: env.DATABASE_URL,
        },
    },
});

async function main() {
    const courseId = "66d46895-f154-410b-81e1-d566f4b78d17";
    console.log(`Checking enrollments for ${courseId}`);

    const enrollments = await prisma.enrollment.findMany({
        where: { courseId: courseId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, amount: true, createdAt: true }
    });

    if (enrollments.length === 0) console.log("No enrollments found.");

    const lines = enrollments.map(e => `${e.amount} | ${e.createdAt.toISOString()}`);
    fs.writeFileSync('enrollments.txt', lines.join('\n'));
    console.log("Written to enrollments.txt");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
