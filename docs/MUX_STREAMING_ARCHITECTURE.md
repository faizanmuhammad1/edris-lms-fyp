# Mux Streaming Architecture & Quality Options

## Current Architecture

### Flow

1. **Upload & ingest**
   - Teacher uploads video → stored in **Tigris S3** (`videoKey`).
   - On lesson save, **`triggerMuxAssetCreation(lessonId, videoKey)`** runs (e.g. from `app/teacher/.../actions.ts`, `app/teacher/.../edit/actions.ts`).
   - Presigned S3 URL is generated; **Mux** ingests from that URL and creates an asset with **signed playback policy**.
   - Lesson is updated with `muxAssetId`, `muxPlaybackId`, `muxStatus` (`preparing` → `ready` or `errored`).
   - **Webhook** `api/webhooks/mux` (and/or **polling** in `lib/mux-trigger.ts`) updates `muxStatus` when the asset is ready.

2. **Playback**
   - **Dashboard (enrolled users):** `VideoPlayer` gets `muxPlaybackId`. It calls **`POST /api/mux/signed-url`** with `lessonId`; API checks auth + enrollment, then returns short-lived **signed stream + thumbnail URLs** from `lib/mux.ts` (JWT-signed with `MUX_SIGNING_PRIVATE_KEY`).
   - **Public course preview:** `get-course.ts` builds signed `muxStreamUrl` and `muxThumbnailUrl` for the preview lesson and passes them to `VideoPreviewPlayer`.
   - **Player:** Both use **Vidstack** `MediaPlayer` with `DefaultVideoLayout`. Source is the Mux HLS URL: `https://stream.mux.com/{playbackId}.m3u8?token=...` with `type: "application/x-mpegurl"`.

3. **Security**
   - Mux assets use **signed** playback only (`playback_policy: ["signed"]`).
   - `lib/mux.ts` uses **RS256** JWT with `MUX_SIGNING_KEY_ID` and base64 `MUX_SIGNING_PRIVATE_KEY`.
   - Signed URL API ensures only authorized users (owner, enrolled, or admin) get tokens.

**Required for Tigris:** Set **`AWS_ENDPOINT_URL_S3`** in `.env` so uploads and Mux presigned URLs target Tigris. Use `https://fly.storage.tigris.dev` when the app runs on Fly.io, or `https://t3.storage.dev` when running elsewhere (e.g. local or Vercel). If unset, `triggerMuxAssetCreation` will set the lesson to `muxStatus: "errored"` and log the required value.

---

## What’s in Place

- Mux ingest from S3, signed playback, webhook + polling for status.
- Signed URL API and auth checks for dashboard and preview.
- Vidstack `MediaPlayer` + `DefaultVideoLayout` with HLS source.
- Fallback to direct S3 when `muxPlaybackId` is missing or not ready.
- Progress saving (dashboard only), poster/thumbnail, playback rate, seek step.

---

## Why Quality Option Is Missing

The **DefaultVideoLayout** shows the **quality** item in the settings menu only when **both**:

1. **`canSetQuality`** is true (qualities list is not readonly), and  
2. **`qualities.length > 1`** (more than one rendition).

So the quality option is **hidden** when:

- The player uses **native HLS** (e.g. Safari): the browser doesn’t expose a quality list to JS, so `qualities` is empty or single/readonly → no quality menu.
- **Only one quality** is exposed (e.g. provider didn’t load multi-bitrate manifest, or something went wrong with the HLS provider).

Vidstack chooses the provider by **loader order**:

- If **`preferNativeHLS`** is **true**: try **native video** first → on Safari, native HLS is used → **no quality API**.
- If **`preferNativeHLS`** is **false** (default): try **HLS provider (hls.js)** first → multiple renditions and quality API are available → **quality menu can show**.

So even though the default is `preferNativeHLS: false`, it’s best to **explicitly set `preferNativeHLS={false}`** on `MediaPlayer` so that:

- hls.js is used on all platforms when an HLS source is given.
- `qualities` is populated from the Mux multi-bitrate manifest and the quality menu can appear (when Mux sends multiple renditions).

---

## What’s Lacking / Optional Improvements

| Area | Status | Suggestion |
|------|--------|------------|
| **Quality selector** | Visible (hls.js enforced) | `preferNativeHLS={false}` successfully configured on `MediaPlayer`. |
| **Error handling** | Basic | Surface Mux `errored` in UI (e.g. “Video is still processing” or “Playback failed”). |
| **Preview vs dashboard** | Preview uses precomputed signed URLs; dashboard uses API | Already correct; ensure token expiry (e.g. 2h) is acceptable for long previews. |
| **No HlsProvider wrapper** | Source passed directly to `MediaPlayer` | Not required; Vidstack’s loader picks HLS for `application/x-mpegurl`. Explicit `preferNativeHLS={false}` is the main fix. |
| **Analytics** | None | Optional: Mux Data (or similar) for quality switches, errors, watch time. |

---

## Files Involved

| File | Role |
|------|------|
| `lib/mux.ts` | Mux client, signed JWT, `getMuxSignedStreamUrl` / `getMuxSignedThumbnailUrl` |
| `lib/mux-trigger.ts` | `triggerMuxAssetCreation`, `deleteMuxAssets`, polling for asset status |
| `app/api/mux/signed-url/route.ts` | POST: returns signed stream + thumbnail URL for a lesson |
| `app/api/webhooks/mux/route.ts` | Mux webhook: updates lesson `muxStatus` / `muxPlaybackId` |
| `components/dashboard/VideoPlayer.tsx` | Dashboard player (Mux signed URL or S3 fallback) |
| `app/(public)/courses/[slug]/_components/VideoPreviewPlayer.tsx` | Public preview player |
| `app/data/course/get-course.ts` | Builds `muxStreamUrl` / `muxThumbnailUrl` for preview lesson |
| `prisma/schema.prisma` | Lesson: `muxAssetId`, `muxPlaybackId`, `muxStatus` |

---

## Summary

- **Architecture:** Upload → S3; Mux ingest from S3; signed HLS playback via Vidstack; auth via signed URL API and enrollment checks.
- **Quality not showing:** Layout hides quality when there’s only one level or when the provider doesn’t expose a writable quality list (e.g. native HLS). Forcing hls.js with **`preferNativeHLS={false}`** ensures multiple qualities are available and the quality option can appear when Mux serves multiple renditions.
