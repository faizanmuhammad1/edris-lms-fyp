
import { prisma } from "../lib/db";
import { generateLessonSummary } from "../lib/generate-summary";

async function main() {
    console.log("Starting backfill for missing lesson summaries...");

    const lessonsWithoutSummary = await prisma.lesson.findMany({
        where: {
            transcript: {
                not: null,
            },
            videoSummary: null,
        },
        select: {
            id: true,
            title: true,
        },
    });

    console.log(`Found ${lessonsWithoutSummary.length} lessons with transcripts but no summary.`);

    for (const lesson of lessonsWithoutSummary) {
        console.log(`Generating summary for lesson: ${lesson.title} (${lesson.id})`);
        try {
            const summary = await generateLessonSummary(lesson.id);
            console.log(`Successfully generated summary for ${lesson.title}`);
        } catch (error) {
            console.error(`Failed to generate summary for ${lesson.title}:`, error);
        }
    }

    console.log("Backfill complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
