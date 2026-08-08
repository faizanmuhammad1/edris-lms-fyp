"use server";

import { prisma } from "./db";
import { env } from "./env";

// Lazy imports to avoid issues when Redis is not available
let Queue: typeof import("bullmq").Queue | null = null;
let IORedis: typeof import("ioredis").default | null = null;

// Lazy-load the queue to avoid connection on import
let transcriptionQueue: InstanceType<typeof import("bullmq").Queue> | null = null;

async function getTranscriptionQueue() {
    const redisUrl = process.env.REDIS_URL;

    // Skip if Redis URL is not configured
    if (!redisUrl) {
        console.log("[Transcription] REDIS_URL not configured, skipping queue");
        return null;
    }

    if (!transcriptionQueue) {
        try {
            // Dynamically import to avoid connection issues at module load
            if (!Queue) {
                const bullmq = await import("bullmq");
                Queue = bullmq.Queue;
            }
            if (!IORedis) {
                const ioredis = await import("ioredis");
                IORedis = ioredis.default;
            }

            const connection = new IORedis(redisUrl, {
                maxRetriesPerRequest: null, // Required for BullMQ
                lazyConnect: true,
            });

            transcriptionQueue = new Queue("transcriptions", {
                connection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: "exponential",
                        delay: 5000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            });
        } catch (error) {
            console.error("[Transcription] Failed to create queue:", error);
            return null;
        }
    }
    return transcriptionQueue;
}

/**
 * Constructs a signed/public URL for the video from S3
 */
function constructVideoUrl(videoKey: string): string {
    // Using the same pattern as the LMS for video URLs
    const bucketName = env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    return `https://${bucketName}.fly.storage.tigris.dev/${videoKey}`;
}

/**
 * Schedules a transcription job for a lesson.
 * This should be called whenever a video is uploaded/updated on a lesson.
 * Fails gracefully if Redis is not available.
 */
export async function scheduleTranscription(lessonId: string): Promise<void> {
    try {
        // Get the queue (returns null if Redis not configured)
        const queue = await getTranscriptionQueue();
        if (!queue) {
            console.log(`[Transcription] Queue not available, skipping lesson ${lessonId}`);
            return;
        }

        // Get the lesson with its video key
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                videoKey: true,
                transcriptionStatus: true,
            },
        });

        if (!lesson) {
            console.error(`[Transcription] Lesson not found: ${lessonId}`);
            return;
        }

        if (!lesson.videoKey) {
            console.log(`[Transcription] Lesson ${lessonId} has no video, skipping`);
            return;
        }

        // Don't re-queue if already processing or done
        if (lesson.transcriptionStatus === "Processing") {
            console.log(`[Transcription] Lesson ${lessonId} is already processing`);
            return;
        }

        // Construct the video URL
        const videoUrl = constructVideoUrl(lesson.videoKey);

        // Add job to the queue
        const job = await queue.add(
            "transcribe",
            {
                lessonId: lesson.id,
                videoUrl: videoUrl,
            },
            {
                jobId: `transcription-${lesson.id}`, // Prevent duplicate jobs
            }
        );

        console.log(`[Transcription] Scheduled job ${job.id} for lesson ${lessonId}`);

        // Update lesson status to Pending (if not already)
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { transcriptionStatus: "Pending" },
        });
    } catch (error) {
        console.error(`[Transcription] Failed to schedule job for lesson ${lessonId}:`, error);
        // Don't throw - we don't want to break the lesson creation/update flow
    }
}

/**
 * Schedules transcription for all lessons in a course that don't have transcripts yet.
 * Useful for batch processing existing courses.
 */
export async function scheduleTranscriptionForCourse(courseId: string): Promise<number> {
    const lessons = await prisma.lesson.findMany({
        where: {
            Chapter: {
                courseId: courseId,
            },
            videoKey: { not: null },
            transcriptionStatus: { in: ["Pending", "Failed"] },
        },
        select: {
            id: true,
        },
    });

    let scheduled = 0;
    for (const lesson of lessons) {
        await scheduleTranscription(lesson.id);
        scheduled++;
    }

    console.log(`[Transcription] Scheduled ${scheduled} jobs for course ${courseId}`);
    return scheduled;
}

/**
 * Retries a failed transcription for a lesson.
 */
export async function retryTranscription(lessonId: string): Promise<void> {
    // Reset status to Pending
    await prisma.lesson.update({
        where: { id: lessonId },
        data: { transcriptionStatus: "Pending" },
    });

    // Schedule the job
    await scheduleTranscription(lessonId);
}
