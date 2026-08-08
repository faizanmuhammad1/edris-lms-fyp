"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { submitTranscriptionJob } from "@/lib/transcription";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

export async function transcribeCourse(courseId: string) {
    const session = await requireUser();

    // 1. Fetch course to verify ownership and get lessons
    const course = await prisma.course.findUnique({
        where: {
            id: courseId,
            userId: session.id, // Ensure user owns the course
        },
        include: {
            chapter: {
                include: {
                    lessons: {
                        // We need to fetch all lessons to check status
                    },
                },
            },
        },
    });

    if (!course) {
        throw new Error("Course not found or unauthorized");
    }

    let queuedCount = 0;
    let failedCount = 0;

    // Use public URL for webhook if available, otherwise use ngrok/dev URL
    // For production, NEXT_PUBLIC_APP_URL is set. 
    // For local dev, we might need a tunnel URL if the microservice is external.
    // Assuming they can talk to each other or using localhost for now if on same machine.
    // If microservice is in docker and this is localhost, `host.docker.internal` might be needed
    // But let's stick to theEnv var.
    const baseUrl = process.env.INTERNAL_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_APP_URL or INTERNAL_WEBHOOK_URL is not defined");
    }
    const webhookUrl = `${baseUrl}/api/webhooks/transcription`;

    // 2. Iterate through lessons and submit jobs
    for (const chapter of course.chapter) {
        for (const lesson of chapter.lessons) {
            if (!lesson.videoKey) continue;

            // Skip if already completed to avoid duplicate work/cost
            if (lesson.transcriptionStatus === "COMPLETED") {
                continue;
            }

            // Construct Video URL 
            const videoUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${lesson.videoKey}`;

            try {
                await submitTranscriptionJob(
                    lesson.id,
                    course.id,
                    videoUrl,
                    webhookUrl
                );

                // Update status to QUEUED
                await prisma.lesson.update({
                    where: { id: lesson.id },
                    data: { transcriptionStatus: "QUEUED" },
                });

                queuedCount++;
            } catch (error) {
                console.error(`Failed to queue lesson ${lesson.id}:`, error);
                failedCount++;
            }
        }
    }

    revalidatePath(`/teacher/courses/${courseId}/edit`);
    return { success: true, count: queuedCount, failedCount };
}
