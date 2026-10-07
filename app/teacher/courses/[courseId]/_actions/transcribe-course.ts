"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

/**
 * Lists the course's lessons that have a video but no completed transcript, in course
 * order. The client transcribes them one request at a time (via transcribeLesson) so
 * each lesson stays within a single function's time limit.
 */
export async function getLessonsToTranscribe(
    courseId: string
): Promise<{ success: true; lessons: { id: string; title: string }[] } | { success: false; error: string }> {
    const session = await requireUser();

    const course = await prisma.course.findFirst({
        where: { id: courseId, userId: session.id },
        select: {
            chapter: {
                orderBy: { position: "asc" },
                select: {
                    lessons: {
                        orderBy: { position: "asc" },
                        select: { id: true, title: true, videoKey: true, transcriptionStatus: true },
                    },
                },
            },
        },
    });

    if (!course) {
        return { success: false, error: "Course not found or unauthorized" };
    }

    const lessons = course.chapter
        .flatMap((chapter) => chapter.lessons)
        .filter((lesson) => lesson.videoKey && lesson.transcriptionStatus !== "COMPLETED")
        .map(({ id, title }) => ({ id, title }));

    return { success: true, lessons };
}
