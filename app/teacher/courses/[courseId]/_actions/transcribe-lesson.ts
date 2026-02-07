"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { submitTranscriptionJob } from "@/lib/transcription";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

export async function transcribeLesson(lessonId: string, courseId: string) {
    const session = await requireUser();

    // 1. Fetch lesson and verify ownership (via course)
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            Chapter: {
                include: {
                    Course: {
                        select: { userId: true, id: true }
                    }
                }
            }
        }
    });

    if (!lesson || lesson.Chapter.Course.userId !== session.id) {
        throw new Error("Lesson not found or unauthorized");
    }

    if (!lesson.videoKey) {
        throw new Error("Lesson has no video");
    }

    // FORCE RETRY: We do not check current status here because the user explicitly requested this action.

    // Determine Webhook URL
    const baseUrl = process.env.INTERNAL_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_APP_URL or INTERNAL_WEBHOOK_URL is not defined");
    }
    const webhookUrl = `${baseUrl}/api/webhooks/transcription`;

    // Construct Video URL
    const videoUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${lesson.videoKey}`;

    try {
        await submitTranscriptionJob(
            lesson.id,
            lesson.Chapter.Course.id,
            videoUrl,
            webhookUrl
        );

        // Update status
        await prisma.lesson.update({
            where: { id: lesson.id },
            data: { transcriptionStatus: "QUEUED" },
        });

        revalidatePath(`/teacher/courses/${courseId}/edit`);
        return { success: true };
    } catch (error) {
        console.error("Failed to transcribe lesson:", error);
        return { success: false, error: "Failed to submit job" };
    }
}
