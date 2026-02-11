import { PrismaClient } from "../lib/generated/prisma";
import { env } from "../lib/env";
import Stripe from "stripe";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: env.DATABASE_URL,
        },
    },
});

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
    typescript: true,
});

async function main() {
    const courseId = "66d46895-f154-410b-81e1-d566f4b78d17"; // From user request
    console.log(`🔍 Inspecting Course ID: ${courseId}`);

    const course = await prisma.course.findUnique({
        where: { id: courseId },
    });

    if (!course) {
        console.log("❌ Course not found in DB.");
        return;
    }

    console.log(`✅ Found Course: "${course.title}"`);
    console.log(`   DB Price: ${course.price}`);
    console.log(`   Stripe Price ID: ${course.stripePriceId}`);

    if (course.stripePriceId) {
        try {
            const price = await stripe.prices.retrieve(course.stripePriceId);
            console.log(`   Stripe Price Object ID: ${price.id}`);
            console.log(`   Stripe Unit Amount: ${price.unit_amount} cents`);

            const expected = course.price * 100;
            if (price.unit_amount === expected) {
                console.log(`✅ MATCH: Stripe amount (${price.unit_amount}) == DB Price * 100.`);
            } else {
                console.log(`❌ MISMATCH: Stripe amount (${price.unit_amount}) != DB Price * 100 (${expected}).`);
                console.log(`   This means the user will be charged $${price.unit_amount! / 100} instead of $${course.price}.`);
            }

            // Check Enrollments
            const enrollments = await prisma.enrollment.findMany({
                where: { courseId: course.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            });
            console.log(`\n🔍 Found ${enrollments.length} recent enrollments:`);
            enrollments.forEach(e => {
                console.log(`   - ID: ${e.id}, Amount: ${e.amount}, Status: ${e.status}, Created: ${e.createdAt}`);
            });

        } catch (e) {
            console.error("❌ Error retrieving details:", e);
        }
    } else {
        console.log("❌ No Stripe Price ID on course.");
    }
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
