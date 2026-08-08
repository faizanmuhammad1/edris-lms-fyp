# Mux Implementation – Security & Quality Audit

## Summary

**Verdict: Implementation is solid and secure for an LMS.** Playback is correctly restricted with signed URLs, access is enforced server-side, and secrets stay on the server. A few small hardening steps are recommended below.

---

## Architecture Overview

| Component | Purpose |
|-----------|--------|
| **lib/mux.ts** | Mux API client (token ID/secret); JWT signing for playback/thumbnails (RS256, signing key). Server-only. |
| **lib/mux-trigger.ts** | Server action: create Mux asset from S3 presigned URL, update lesson, poll for ready/errored. |
| **api/mux/signed-url** | POST: returns short-lived signed stream + thumbnail URLs. Auth + enrollment checked. |
| **api/mux/asset** | POST: create Mux asset (teacher/admin, lesson owner). Used as alternate trigger path. |
| **api/webhooks/mux** | Mux → your app: verify signature, update lesson `muxStatus` / `muxPlaybackId`. |

---

## Security Assessment

### What’s done well

1. **Signed playback only**  
   Assets are created with `playback_policy: ["signed"]`. Streams are not playable without a valid JWT; playback IDs alone are not enough.

2. **Secrets only on server**  
   - `lib/mux.ts` is `"server-only"`.  
   - Signing uses `MUX_SIGNING_PRIVATE_KEY` (base64) and `MUX_SIGNING_KEY_ID`; these are never sent to the client.  
   - Client only gets time-limited signed URLs from your API, not the key or raw playback secrets.

3. **Authorization before issuing URLs**  
   - **Dashboard:** `POST /api/mux/signed-url` requires auth, then checks course owner **or** active enrollment **or** admin before returning URLs.  
   - **Public preview:** Signed URLs are built in `get-course.ts` on the server and passed to the page; no signing key or long-lived token is exposed.

4. **JWT for playback**  
   - RS256, `sub` = playback ID, `aud` = type (v/t/…), `exp` (e.g. 2 hours), `kid` = signing key ID.  
   - Matches Mux’s signed playback model and limits token reuse.

5. **Webhook verification**  
   - Uses `mux-signature` header.  
   - Payload = `timestamp + "." + rawBody`.  
   - HMAC-SHA256 with `MUX_WEBHOOK_SECRET`, then **timing-safe** comparison so signature check doesn’t leak information.

6. **S3 → Mux ingest**  
   - Short-lived presigned URL (e.g. 1 hour) for Mux to pull the file; not exposed to end users.

7. **Cleanup**  
   - When lessons/chapters/courses are deleted or video is changed, Mux assets are deleted via `deleteMuxAssets`, avoiding orphaned assets and unnecessary cost.

8. **Middleware**  
   - Webhook path `api/webhooks/mux` is excluded from auth so Mux can POST without a user session.

---

## Gaps and Recommendations

### 1. Webhook: replay protection (recommended)

Mux recommends rejecting webhooks with timestamps outside a short window (e.g. 5 minutes) to prevent replay of old, valid signatures.

- **Add:** After parsing `timestamp`, check `Math.abs(Date.now() / 1000 - Number(timestamp)) <= 300` (or similar). If outside the window, return 401.

### 2. Webhook: safe signature comparison

`crypto.timingSafeEqual(a, b)` throws if `a.length !== b.length`. A malformed or attacker-controlled signature length could cause a 500 instead of 401.

- **Add:** Compare `Buffer.byteLength(signature, 'hex')` with `expectedSignature.length` (or buffer lengths). If different, return 401 without calling `timingSafeEqual`.

### 3. Webhook: env consistency

Webhook uses `process.env.MUX_WEBHOOK_SECRET` instead of the validated `env` from `lib/env`. If you ever load env differently (e.g. in edge), the webhook might see a different value.

- **Optional:** Use `env.MUX_WEBHOOK_SECRET` from `lib/env` so all Mux-related secrets come from one validated source. Ensure the webhook route can still run in the same runtime as the rest of the app.

### 4. Signed-URL API: rate limiting (optional)

`POST /api/mux/signed-url` has no rate limit. A logged-in user could spam requests and obtain many tokens (each valid for ~2 hours).

- **Optional:** Add rate limiting (e.g. per user or per IP) to reduce abuse and unnecessary load.

### 5. Public preview token lifetime

Preview URLs are generated at page load with the same 2-hour expiry as dashboard URLs. Anyone with the course page link can watch the preview until the token expires.

- **Acceptable** for a public “course preview” experience. If you want shorter exposure, reduce `expiresInSeconds` only for the preview path (e.g. 15–30 minutes) in `get-course.ts`.

### 6. Playback ID in client

Dashboard lesson data (e.g. from `get-lesson-content`) includes `muxPlaybackId` and is sent to the client. The playback ID by itself does **not** allow playback because policy is signed and your server issues JWTs only after auth + enrollment checks. No change required for security; optional hardening would be to never send playback ID to the client and only ever send signed URLs from the server.

---

## Implementation quality

- **Idempotency / duplicates:** `triggerMuxAssetCreation` skips when the lesson already has a Mux asset for the same `videoKey`; replaces asset when the video changes and deletes the old one.  
- **Status flow:** Webhook + polling keep `muxStatus` / `muxPlaybackId` in sync; UI can show “preparing” vs “ready” vs “errored”.  
- **Errors:** Mux errors in `get-course` are caught so the page doesn’t crash; signed-url API returns 4xx/5xx with clear messages.  
- **Deletion:** Course/chapter/lesson delete flows collect `muxAssetId` and call `deleteMuxAssets` so Mux and DB stay aligned.

---

## Checklist summary

| Item | Status |
|------|--------|
| Playback policy signed-only | Yes |
| Signing key only on server | Yes |
| Auth + enrollment before signed URL | Yes |
| Webhook signature verified (HMAC + timing-safe) | Yes |
| Webhook replay protection | Yes |
| Webhook comparison safe (length check) | Yes |
| S3 ingest presigned, short-lived | Yes |
| Asset cleanup on delete/change | Yes |
| Webhook path excluded from auth | Yes |
| Rate limit on signed-url | Optional |

Overall, the Mux implementation is **good and secure**. Adding replay protection and a safe comparison in the webhook will align it with best practice; the rest is optional hardening.
