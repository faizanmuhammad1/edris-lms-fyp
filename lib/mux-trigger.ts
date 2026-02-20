"use server";

import { env } from "@/lib/env";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import { mux } from "@/lib/mux";
import { prisma } from "@/lib/db";

/**
 * Deletes Mux assets for one or more asset IDs.
 * Silently skips any that fail (non-blocking).
 */
export async function deleteMuxAssets(assetIds: string[]): Promise<void> {
    const validIds = assetIds.filter(Boolean);
    if (validIds.length === 0) return;

    await Promise.allSettled(
        validIds.map(async (assetId) => {
            try {
                await mux.video.assets.delete(assetId);
                console.log(`[Mux] Deleted asset: ${assetId}`);
            } catch (err) {
                console.warn(`[Mux] Failed to delete asset ${assetId}:`, err);
            }
        })
    );
}

/**
 * Triggers Mux asset creation for a lesson's video.
 * This runs in the background — it won't block the lesson save.
 *
 * Call this after saving a lesson with a videoKey.
 * It skips if: no videoKey, or the lesson already has a Mux asset for this video.
 */
export async function triggerMuxAssetCreation(
    lessonId: string,
    videoKey: string
): Promise<void> {
    try {
        // Presigned URLs must target the same storage as uploads. If you use Tigris, set AWS_ENDPOINT_URL_S3.
        if (!env.AWS_ENDPOINT_URL_S3) {
            console.error(
                "[Mux] AWS_ENDPOINT_URL_S3 is not set. Set it so Mux can fetch the video: " +
                    "Tigris on Fly use https://fly.storage.tigris.dev, Tigris elsewhere use https://t3.storage.dev"
            );
            await prisma.lesson.update({
                where: { id: lessonId },
                data: { muxStatus: "errored" },
            }).catch(() => {});
            return;
        }

        // Check if this lesson already has a Mux asset (avoid duplicates)
        const existingLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { muxAssetId: true, videoKey: true },
        });

        // Skip if already has a Mux asset for the same video
        if (existingLesson?.muxAssetId && existingLesson.videoKey === videoKey) {
            console.log(`[Mux] Lesson ${lessonId} already has Mux asset, skipping`);
            return;
        }

        // If video changed and old Mux asset exists, delete old asset
        if (existingLesson?.muxAssetId && existingLesson.videoKey !== videoKey) {
            try {
                await mux.video.assets.delete(existingLesson.muxAssetId);
                console.log(`[Mux] Deleted old asset ${existingLesson.muxAssetId}`);
            } catch (err) {
                console.warn(`[Mux] Failed to delete old asset:`, err);
            }
        }

        console.log(
            `[Mux] Creating asset for lesson ${lessonId}, video: ${videoKey}`
        );

        // Generate a presigned URL so Mux can fetch the video from S3 (Tigris or AWS).
        // S3 client must use the same endpoint as uploads (e.g. AWS_ENDPOINT_URL_S3 for Tigris).
        const command = new GetObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: videoKey,
        });
        const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });

        // Create the Mux asset with signed playback policy
        const asset = await mux.video.assets.create({
            inputs: [{ url: presignedUrl }],
            playback_policy: ["signed"],
        });

        const playbackId = asset.playback_ids?.[0]?.id || null;

        // Update the lesson with Mux asset info
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                muxAssetId: asset.id,
                muxPlaybackId: playbackId,
                muxStatus: asset.status || "preparing",
            },
        });

        console.log(
            `[Mux] Asset created: ${asset.id}, playbackId: ${playbackId}, status: ${asset.status}`
        );

        // Poll Mux for asset readiness (fallback if webhook is delayed/not configured)
        pollMuxAssetStatus(asset.id, lessonId).catch((err) =>
            console.warn("[Mux] Polling failed:", err)
        );
    } catch (error) {
        const err = error as Error & { body?: unknown; data?: unknown; response?: { body?: unknown } };
        const detail =
            err.body ?? err.data ?? err.response?.body ?? err.message ?? String(error);
        console.error(
            `[Mux] Failed to create asset for lesson ${lessonId}:`,
            err.message ?? error,
            "detail:",
            typeof detail === "object" ? JSON.stringify(detail) : detail
        );
        // Mark lesson as errored so UI shows "Video processing failed" instead of silent fallback
        try {
            await prisma.lesson.update({
                where: { id: lessonId },
                data: { muxStatus: "errored" },
            });
        } catch (updateErr) {
            console.warn("[Mux] Failed to update lesson muxStatus to errored:", updateErr);
        }
    }
}

/**
 * Polls Mux API for asset status until ready or errored.
 * Runs in the background as a fallback to webhooks.
 * Polls every 5 seconds for up to 5 minutes.
 */
async function pollMuxAssetStatus(
    assetId: string,
    lessonId: string,
    maxAttempts: number = 60,
    intervalMs: number = 5000
): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));

        try {
            const asset = await mux.video.assets.retrieve(assetId);

            if (asset.status === "ready") {
                const playbackId = asset.playback_ids?.[0]?.id || null;
                await prisma.lesson.updateMany({
                    where: { muxAssetId: assetId },
                    data: {
                        muxStatus: "ready",
                        ...(playbackId ? { muxPlaybackId: playbackId } : {}),
                    },
                });
                console.log(`[Mux] Poll: Asset ${assetId} is ready (lesson ${lessonId})`);
                return;
            }

            if (asset.status === "errored") {
                await prisma.lesson.updateMany({
                    where: { muxAssetId: assetId },
                    data: { muxStatus: "errored" },
                });
                console.error(`[Mux] Poll: Asset ${assetId} errored`);
                return;
            }
        } catch (err) {
            console.warn(`[Mux] Poll attempt ${i + 1} failed:`, err);
        }
    }
    console.warn(`[Mux] Polling timed out for asset ${assetId}`);
}
