import "server-only";

import Mux from "@mux/mux-node";
import jwt from "jsonwebtoken";
import { env } from "./env";

export const mux = new Mux({
    tokenId: env.MUX_TOKEN_ID,
    tokenSecret: env.MUX_TOKEN_SECRET,
});

/**
 * Generates a signed JWT for Mux secure video playback.
 *
 * The token is signed with RS256 using the Mux signing key pair.
 * The private key is stored as a base64-encoded string in the environment.
 *
 * @param playbackId - The Mux signed playback ID
 * @param expiresInSeconds - Token expiry in seconds (default: 2 hours)
 * @returns The signed JWT token string
 */
export function generateMuxSignedToken(
    playbackId: string,
    type: "video" | "thumbnail" | "gif" | "storyboard" = "video",
    expiresInSeconds: number = 7200
): string {
    // Decode the base64-encoded private key
    const privateKey = Buffer.from(env.MUX_SIGNING_PRIVATE_KEY, "base64").toString(
        "ascii"
    );

    // Map type to Mux audience claim
    const audienceMap: Record<string, string> = {
        video: "v",
        thumbnail: "t",
        gif: "g",
        storyboard: "s",
    };

    const token = jwt.sign(
        {
            sub: playbackId,
            aud: audienceMap[type] || "v",
            exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
            kid: env.MUX_SIGNING_KEY_ID,
        },
        privateKey,
        { algorithm: "RS256" }
    );

    return token;
}

/**
 * Generates a full signed Mux stream URL for a playback ID.
 */
export function getMuxSignedStreamUrl(playbackId: string, expiresInSeconds: number = 7200): string {
    const token = generateMuxSignedToken(playbackId, "video", expiresInSeconds);
    return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

/**
 * Generates a signed Mux thumbnail URL for a playback ID.
 */
export function getMuxSignedThumbnailUrl(
    playbackId: string,
    options?: { width?: number; height?: number; time?: number },
    expiresInSeconds: number = 7200
): string {
    const privateKey = Buffer.from(env.MUX_SIGNING_PRIVATE_KEY, "base64").toString(
        "ascii"
    );

    const claims: Record<string, unknown> = {
        sub: playbackId,
        aud: "t",
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        kid: env.MUX_SIGNING_KEY_ID,
    };

    // Include thumbnail options as JWT claims (Mux requirement for signed URLs)
    if (options?.width) claims.width = options.width;
    if (options?.height) claims.height = options.height;
    if (options?.time) claims.time = options.time;

    const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });
    return `https://image.mux.com/${playbackId}/thumbnail.webp?token=${token}`;
}
