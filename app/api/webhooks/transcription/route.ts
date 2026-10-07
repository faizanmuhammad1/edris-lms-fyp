import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyTranscriptionSignature } from "@/lib/transcription";
import { generateLessonSummary } from "@/lib/generate-summary";

// Summary generation (OpenAI) runs via after() once the response is sent.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const signature = req.headers.get("X-Signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const rawBody = await req.text();

    if (!verifyTranscriptionSignature(rawBody, signature)) {
        console.error("Invalid transcription signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let data: { lesson_id?: string; status?: string; transcript?: string; segments?: unknown };
    try {
        data = JSON.parse(rawBody);
    } catch (e) {
        console.error("Transcription webhook: invalid JSON", e);
        return NextResponse.json({ received: true });
    }

    const lessonId = data.lesson_id;
    const status = (data.status ?? "").toLowerCase();

    if (!lessonId || typeof lessonId !== "string") {
        console.error("Transcription webhook: missing or invalid lesson_id");
        return NextResponse.json({ received: true });
    }

    try {
        const lessonExists = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true },
        });
        if (!lessonExists) {
            console.error("Transcription webhook: lesson not found", lessonId);
            return NextResponse.json({ received: true });
        }

        if (status === "failed" || status === "error") {
            await prisma.lesson.update({
                where: { id: lessonId },
                data: { transcriptionStatus: "FAILED" },
            });
            return NextResponse.json({ received: true });
        }

        if (status === "completed") {
            const transcript = data.transcript;
            const segments = data.segments;
            const hasValidTranscript = typeof transcript === "string" && transcript.trim().length > 0;
            await prisma.lesson.update({
                where: { id: lessonId },
                data: {
                    ...(hasValidTranscript && {
                        transcript,
                        transcriptionSegments: segments != null ? segments : undefined,
                    }),
                    transcriptionStatus: "COMPLETED",
                },
            });

            if (hasValidTranscript) {
                after(() =>
                    generateLessonSummary(lessonId).catch((err) =>
                        console.error(`Failed to generate summary for lesson ${lessonId}:`, err)
                    )
                );
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Transcription webhook processing error:", error);
        return NextResponse.json({ received: true });
    }
}
