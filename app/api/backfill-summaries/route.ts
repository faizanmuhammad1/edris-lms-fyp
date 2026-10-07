
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateLessonSummary } from "@/lib/generate-summary";

export const maxDuration = 120;

// Admin-only maintenance endpoint: generates missing AI summaries (costs OpenAI credits).
export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session
        ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
        : null;
    if (user?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
