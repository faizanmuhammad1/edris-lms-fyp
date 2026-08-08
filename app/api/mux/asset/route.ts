import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mux } from "@/lib/mux";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";

export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
    });

    if (user?.role !== "admin" && user?.role !== "teacher") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { videoKey, lessonId } = await request.json();

        if (!videoKey || !lessonId) {
            return NextResponse.json(
                { error: "videoKey and lessonId are required" },
                { status: 400 }
            );
        }

        // Verify the lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                Chapter: {
                    include: {
                        Course: { select: { userId: true } },
                    },
                },
            },
        });

        if (!lesson || lesson.Chapter.Course.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Lesson not found or unauthorized" },
                { status: 404 }
            );
        }

        // Generate a presigned URL so Mux can fetch the video from Tigris S3
        const command = new GetObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: videoKey,
        });
        const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });

        // Create the Mux asset from the presigned S3 URL
        const asset = await mux.video.assets.create({
            inputs: [{ url: presignedUrl }],
            playback_policy: ["signed"],
        });

        const playbackId = asset.playback_ids?.[0]?.id || null;

        // Update the lesson with the Mux asset info
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                muxAssetId: asset.id,
                muxPlaybackId: playbackId,
                muxStatus: asset.status || "preparing",
            },
        });

        return NextResponse.json({
            assetId: asset.id,
            playbackId,
            status: asset.status,
        });
    } catch (error) {
        const err = error as Error & { body?: unknown; data?: unknown; response?: { body?: unknown } };
        const detail =
            err.body ?? err.data ?? err.response?.body ?? err.message ?? String(error);
        console.error(
            "Mux asset creation error:",
            err.message ?? error,
            "detail:",
            typeof detail === "object" ? JSON.stringify(detail) : detail
        );
        return NextResponse.json(
            { error: "Failed to create Mux asset" },
            { status: 500 }
        );
    }
}
