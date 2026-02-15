import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signatureHeader = request.headers.get("mux-signature") || "";

        // Verify webhook signature
        const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
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

        switch (type) {
            case "video.asset.ready": {
                const assetId = data.id as string;
                const playbackId = data.playback_ids?.[0]?.id as string | undefined;

                await prisma.lesson.updateMany({
                    where: { muxAssetId: assetId },
                    data: {
                        muxStatus: "ready",
                        ...(playbackId ? { muxPlaybackId: playbackId } : {}),
                    },
                });

                console.log(`Mux asset ${assetId} is ready`);
                break;
            }

            case "video.asset.errored": {
                const assetId = data.id as string;

                await prisma.lesson.updateMany({
                    where: { muxAssetId: assetId },
                    data: { muxStatus: "errored" },
                });

                console.error(`Mux asset ${assetId} errored:`, data.errors);
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
