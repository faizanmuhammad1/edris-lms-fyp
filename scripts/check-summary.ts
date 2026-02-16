import { prisma } from "../lib/db";

async function main() {
    const totalLessons = await prisma.lesson.count();
    const lessonsWithSummary = await prisma.lesson.count({
        where: {
            videoSummary: {
                not: null,
            },
        },
    });
    const lessonsWithTranscript = await prisma.lesson.count({
        where: {
            transcript: {
                not: null,
            },
        },
    });

    console.log(`Total Lessons: ${totalLessons}`);
    console.log(`Lessons with Summary: ${lessonsWithSummary}`);
    console.log(`Lessons with Transcript: ${lessonsWithTranscript}`);

    const sample = await prisma.lesson.findFirst({
        where: {
            transcript: { not: null },
            videoSummary: null
        },
        select: { id: true, title: true }
    });

    if (sample) {
        console.log(`Sample lesson with transcript but NO summary: ${sample.title} (${sample.id})`);
    } else {
        console.log("All lessons with transcripts have summaries (or there are no lessons with transcripts).");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
