import crypto from "crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";

/** How long the transcriber may take to start downloading the video. */
const TRANSCRIPTION_VIDEO_URL_TTL_SECONDS = 6 * 60 * 60;

/**
 * Presigned GET URL for a lesson video, generated with the same S3 client/endpoint
 * used for uploads (bucket objects are private; keys may contain spaces etc.).
 */
export async function getTranscriptionVideoUrl(videoKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    Key: videoKey,
  });
  return getSignedUrl(S3, command, { expiresIn: TRANSCRIPTION_VIDEO_URL_TTL_SECONDS });
}

function getTranscriberConfig(): { serviceUrl: string; secret: string } {
  const serviceUrl = process.env.TRANSCRIBER_SERVICE_URL?.replace(/\/$/, "");
  const secret = process.env.TRANSCRIBER_SECRET;
  if (!serviceUrl || !secret) {
    throw new Error("TRANSCRIBER_SERVICE_URL and TRANSCRIBER_SECRET must be set");
  }
  return { serviceUrl, secret };
}

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
    const videoUrl = await getTranscriptionVideoUrl(lesson.videoKey);

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
    const { serviceUrl, secret } = getTranscriberConfig();
    const url = `${serviceUrl}/jobs`;
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
                Authorization: `Bearer ${secret}`,
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

    const secret = process.env.TRANSCRIBER_SECRET;
    if (!secret) {
        console.error("[Transcription] TRANSCRIBER_SECRET is not set; rejecting webhook");
        return false;
    }

    const received = Buffer.from(signatureHeader.slice("sha256=".length), "utf8");
    const expected = Buffer.from(
        crypto.createHmac("sha256", secret).update(payload).digest("hex"),
        "utf8"
    );

    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}
