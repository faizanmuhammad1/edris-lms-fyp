import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signatureHeader = request.headers.get("mux-signature") || "";

        // Verify webhook signature (use validated env for consistency)
        const webhookSecret = env.MUX_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("MUX_WEBHOOK_SECRET is not set");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        // Mux sends: t=<timestamp>,v1=<signature>
        const parts = signatureHeader.split(",");
        const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
        const signature = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

        if (!timestamp || !signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // Replay protection: reject if timestamp is older than 5 minutes
        const ts = Number(timestamp);
        if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
            return NextResponse.json({ error: "Invalid or expired timestamp" }, { status: 401 });
        }

        const payload = `${timestamp}.${rawBody}`;
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(payload)
            .digest("hex");

        const sigBuf = Buffer.from(signature, "hex");
        const expectedBuf = Buffer.from(expectedSignature, "hex");
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(rawBody);
        const type = event.type as string;
        const data = event.data;

        // If no lesson references this asset yet, check whether the lesson that created it
        // (asset passthrough = lessonId) is still waiting for triggerMuxAssetCreation to store
        // muxAssetId. In that case respond non-2xx so Mux retries the webhook later.
        const isAwaitingAssetId = async (): Promise<boolean> => {
            const lessonId = typeof data?.passthrough === "string" ? data.passthrough : null;
            if (!lessonId) return false;
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
                select: { muxAssetId: true, videoKey: true, muxStatus: true },
            });
            return !!lesson && !!lesson.videoKey && !lesson.muxAssetId && lesson.muxStatus !== "errored";
        };

        switch (type) {
            case "video.asset.ready": {
                const assetId = data.id as string;
                const playbackId = data.playback_ids?.[0]?.id as string | undefined;

                const result = await prisma.lesson.updateMany({
                    where: { muxAssetId: assetId },
                    data: {
                        muxStatus: "ready",
                        ...(playbackId ? { muxPlaybackId: playbackId } : {}),
                    },
                });

                if (result.count === 0 && (await isAwaitingAssetId())) {
                    return NextResponse.json({ error: "Lesson not linked to asset yet" }, { status: 409 });
                }

                break;
            }

            case "video.asset.errored": {
                const assetId = data.id as string;

                const result = await prisma.lesson.updateMany({
                    where: { muxAssetId: assetId },
                    data: { muxStatus: "errored" },
                });

                console.error(`Mux asset ${assetId} errored:`, data.errors);

                if (result.count === 0 && (await isAwaitingAssetId())) {
                    return NextResponse.json({ error: "Lesson not linked to asset yet" }, { status: 409 });
                }
                break;
            }

            default:
                // Ignore other event types
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Mux webhook error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
