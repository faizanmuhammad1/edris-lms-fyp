import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyTranscriptionSignature } from "@/lib/transcription";

export async function POST(req: NextRequest) {
    const signature = req.headers.get("X-Signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Get raw body as buffer/string for signature verification
    const rawBody = await req.text();

    if (!verifyTranscriptionSignature(rawBody, signature)) {
        console.error("Invalid transcription signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    try {
        const data = JSON.parse(rawBody);
        const { lesson_id, status, transcript, segments, job_id } = data;

        if (status === "completed") {
            await prisma.lesson.update({
                where: { id: lesson_id },
                data: {
                    transcript: transcript,
                    transcriptionSegments: segments,
                    transcriptionStatus: "COMPLETED",
                },
            });
            console.log(`Transcription completed for lesson ${lesson_id}`);
        } else if (status === "failed") {
            await prisma.lesson.update({
                where: { id: lesson_id },
                data: {
                    transcriptionStatus: "FAILED",
                },
            });
            console.error(`Transcription failed for lesson ${lesson_id} (job ${job_id})`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
