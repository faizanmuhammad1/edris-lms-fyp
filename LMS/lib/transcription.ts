import crypto from "crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const TRANSCRIBER_SERVICE_URL = process.env.TRANSCRIBER_SERVICE_URL || "http://localhost:8000";
const TRANSCRIBER_SECRET = process.env.TRANSCRIBER_SECRET || "default_secret";

/** Statuses that mean we should not start another transcription job */
const TRANSCRIPTION_IN_PROGRESS = ["COMPLETED", "QUEUED", "PROCESSING"] as const;

/**
 * Trigger transcription for a lesson when it has a video. Called in the background after
 * lesson create/update with videoKey. Never throws; logs and returns on any error.
 */
export async function triggerTranscriptionForLesson(lessonId: string): Promise<void> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        videoKey: true,
        transcriptionStatus: true,
        Chapter: { select: { courseId: true } },
      },
    });

    if (!lesson?.videoKey?.trim()) {
      return;
    }
    if (lesson.Chapter == null) {
      return;
    }
    if (TRANSCRIPTION_IN_PROGRESS.includes(lesson.transcriptionStatus as (typeof TRANSCRIPTION_IN_PROGRESS)[number])) {
      return;
    }

    const baseUrl = process.env.INTERNAL_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
    if (!baseUrl) {
      console.warn("[Transcription] Cannot auto-trigger: INTERNAL_WEBHOOK_URL or NEXT_PUBLIC_APP_URL not set");
      return;
    }

    const webhookUrl = `${baseUrl}/api/webhooks/transcription`;
    const videoUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${lesson.videoKey}`;

    await submitTranscriptionJob(lessonId, lesson.Chapter.courseId, videoUrl, webhookUrl);

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { transcriptionStatus: "QUEUED" },
    });
  } catch (err) {
    console.error("[Transcription] Auto-trigger failed for lesson", lessonId, err);
  }
}

/**
 * Submits a video URL for transcription.
 */
export async function submitTranscriptionJob(
    lessonId: string,
    courseId: string,
    videoUrl: string,
    webhookUrl: string
) {
    const url = `${TRANSCRIBER_SERVICE_URL}/jobs`;
    const body = {
        lesson_id: lessonId,
        course_id: courseId,
        video_url: videoUrl,
        webhook_url: webhookUrl,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TRANSCRIBER_SECRET}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Transcription service error: ${response.status} ${errorText}`);
            throw new Error(`Transcription service returned ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to submit transcription job:", error);
        throw error;
    }
}

/**
 * Verifies the HMAC signature from the transcription service webhook.
 */
export function verifyTranscriptionSignature(
    payload: string,
    signatureHeader: string
): boolean {
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
        return false;
    }

    const receivedHash = signatureHeader.split("=")[1];
    const expectedHash = crypto
        .createHmac("sha256", TRANSCRIBER_SECRET)
        .update(payload)
        .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
}
