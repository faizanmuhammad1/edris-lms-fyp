// Server-only helpers (NOT server actions): these must never be callable from the client.
import "server-only";

import { env } from "@/lib/env";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import { mux } from "@/lib/mux";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";

/**
 * Lesson fields derived from the video. Apply these in the same update that changes or
 * removes a lesson's videoKey so students never see the old Mux playback / transcript.
 */
export function lessonVideoResetData(): Prisma.LessonUpdateManyMutationInput {
    return {
        muxAssetId: null,
        muxPlaybackId: null,
        muxStatus: null,
        transcriptionStatus: "NOT_STARTED",
        transcript: null,
        transcriptionSegments: Prisma.DbNull,
        videoSummary: null,
    };
}

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
 * Callers should run it via `after()` so it doesn't block the lesson save
 * but still completes on serverless platforms.
 *
 * Call this after saving a lesson with a videoKey. When the video changes, the
 * caller must clear muxAssetId/muxPlaybackId/muxStatus in the same update.
 * It skips if the lesson already has a Mux asset for this video.
 * Readiness (muxStatus/muxPlaybackId) is then updated by the Mux webhook
 * (app/api/webhooks/mux/route.ts).
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

        // Create the Mux asset with signed playback policy.
        // passthrough lets the webhook identify the lesson if it arrives before we store muxAssetId.
        const asset = await mux.video.assets.create({
            inputs: [{ url: presignedUrl }],
            playback_policy: ["signed"],
            passthrough: lessonId,
        });

        const playbackId = asset.playback_ids?.[0]?.id || null;

        // Update the lesson with Mux asset info, but only if the lesson still points at
        // this video (the teacher may have replaced it again while we were creating the asset).
        const updated = await prisma.lesson.updateMany({
            where: { id: lessonId, videoKey },
            data: {
                muxAssetId: asset.id,
                muxPlaybackId: playbackId,
                muxStatus: asset.status || "preparing",
            },
        });

        if (updated.count === 0) {
            console.warn(
                `[Mux] Lesson ${lessonId} no longer uses video ${videoKey}; deleting stale asset ${asset.id}`
            );
            await deleteMuxAssets([asset.id]);
            return;
        }

        console.log(
            `[Mux] Asset created: ${asset.id}, playbackId: ${playbackId}, status: ${asset.status}`
        );
        // Readiness is delivered by the Mux webhook (video.asset.ready / video.asset.errored).
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
            await prisma.lesson.updateMany({
                where: { id: lessonId, videoKey },
                data: { muxStatus: "errored" },
            });
        } catch (updateErr) {
            console.warn("[Mux] Failed to update lesson muxStatus to errored:", updateErr);
        }
    }
}
