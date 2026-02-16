
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateLessonSummary } from "@/lib/generate-summary";

export async function GET() {
    try {
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
            take: 5, // Process 5 at a time to avoid timeout
        });

        if (lessonsWithoutSummary.length === 0) {
            return NextResponse.json({ message: "No lessons found needing summary backfill." });
        }

        const results = [];

        for (const lesson of lessonsWithoutSummary) {
            try {
                await generateLessonSummary(lesson.id);
                results.push({ id: lesson.id, title: lesson.title, status: "success" });
            } catch (error) {
                console.error(`Failed to generate summary for ${lesson.title}:`, error);
                results.push({ id: lesson.id, title: lesson.title, status: "error", error: String(error) });
            }
        }

        return NextResponse.json({
            message: `Processed ${results.length} lessons`,
            remaining: await prisma.lesson.count({
                where: {
                    transcript: { not: null },
                    videoSummary: null,
                }
            }),
            results
        });

    } catch (error) {
        console.error("Backfill error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
