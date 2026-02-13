import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getMuxSignedStreamUrl, getMuxSignedThumbnailUrl } from "@/lib/mux";
import { NextResponse } from "next/server";

/**
 * Generates a time-limited signed URL for Mux video playback.
 * This ensures videos can only be played by authenticated users
 * with a valid, non-expired token.
 */
export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { lessonId } = await request.json();

        if (!lessonId) {
            return NextResponse.json(
                { error: "lessonId is required" },
                { status: 400 }
            );
        }

        // Fetch lesson and verify the user has access (enrolled or owner)
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                muxPlaybackId: true,
                Chapter: {
                    select: {
                        Course: {
                            select: {
                                userId: true,
                                enrollment: {
                                    where: { userId: session.user.id, status: "Active" },
                                    select: { id: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!lesson || !lesson.muxPlaybackId) {
            return NextResponse.json(
                { error: "Lesson not found or no Mux video" },
                { status: 404 }
            );
        }

        // Authorization: user must be the course owner OR actively enrolled
        const course = lesson.Chapter.Course;
        const isOwner = course.userId === session.user.id;
        const isEnrolled = course.enrollment.length > 0;

        // Also allow admins
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });
        const isAdmin = user?.role === "admin";

        if (!isOwner && !isEnrolled && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Generate signed URLs (valid for 2 hours)
        const streamUrl = getMuxSignedStreamUrl(lesson.muxPlaybackId);
        const thumbnailUrl = getMuxSignedThumbnailUrl(lesson.muxPlaybackId, {
            width: 1920,
        });

        return NextResponse.json({
            streamUrl,
            thumbnailUrl,
        });
    } catch (error) {
        console.error("Mux signed URL error:", error);
        return NextResponse.json(
            { error: "Failed to generate signed URL" },
            { status: 500 }
        );
    }
}
