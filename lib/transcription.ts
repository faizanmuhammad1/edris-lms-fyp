
import crypto from "crypto";

const TRANSCRIBER_SERVICE_URL = process.env.TRANSCRIBER_SERVICE_URL || "http://localhost:8000";
const TRANSCRIBER_SECRET = process.env.TRANSCRIBER_SECRET || "default_secret";

/**
 * Submits a video URL for transcription.
 */
export async function submitTranscriptionJob(
    lessonId: string,
    courseId: string,
    videoUrl: string,
    webhookUrl: string
) {
    const url = `${TRANSCRIBER_SERVICE_URL}/jobs`;
    const body = {
        lesson_id: lessonId,
        course_id: courseId,
        video_url: videoUrl,
        webhook_url: webhookUrl,
    };

    console.log(`[Transcription] Submitting job to ${url}`, body);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TRANSCRIBER_SECRET}`,
            },
            body: JSON.stringify(body),
        });
        console.log(`[Transcription] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Transcription service error: ${response.status} ${errorText}`);
            throw new Error(`Transcription service returned ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to submit transcription job:", error);
        throw error;
    }
}

/**
 * Verifies the HMAC signature from the transcription service webhook.
 */
export function verifyTranscriptionSignature(
    payload: string,
    signatureHeader: string
): boolean {
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
        return false;
    }

    const receivedHash = signatureHeader.split("=")[1];
    const expectedHash = crypto
        .createHmac("sha256", TRANSCRIBER_SECRET)
        .update(payload)
        .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
}
