"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { transcribeLessonVideo, type TranscriptionResult } from "@/lib/transcription";
import { revalidatePath } from "next/cache";

/** Transcribes one lesson now (also used to retry). Runs within the page's maxDuration. */
export async function transcribeLesson(lessonId: string, courseId: string): Promise<TranscriptionResult> {
    // Outside the try so auth redirects aren't swallowed.
    const session = await requireUser();

    try {
        // Verify ownership via the lesson's course.
        const lesson = await prisma.lesson.findFirst({
            where: { id: lessonId, Chapter: { Course: { id: courseId, userId: session.id } } },
            select: { id: true, videoKey: true, chapterId: true },
        });

        if (!lesson) {
            return { success: false, error: "Lesson not found or you don't have permission to transcribe it." };
        }

        if (!lesson.videoKey) {
            return { success: false, error: "This lesson has no video to transcribe." };
        }

        // FORCE RETRY: We do not check current status here because the user explicitly requested this action.
        // transcribeLessonVideo returns teacher-safe error messages.
        const result = await transcribeLessonVideo(lesson.id);

        revalidatePath(`/teacher/courses/${courseId}/edit`);
        revalidatePath(`/teacher/courses/${courseId}/${lesson.chapterId}/${lesson.id}`);
        return result;
    } catch (err) {
        console.error("[transcribeLesson] Failed for lesson", lessonId, err);
        return { success: false, error: "Transcription failed. Please try again." };
    }
}
