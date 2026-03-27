---
name: PDF digital signatures
overview: Add server-generated, digitally signed certificate PDFs so any PDF edits invalidate the signature, while keeping your existing blockchain/QR verification flow as a secondary integrity check.
todos:
  - id: signing-provisioning
    content: Provision X.509 signing materials (private key + signer certificate), add secure env vars, and document rotation policy.
    status: completed
  - id: pdf-render-endpoint
    content: Implement an internal HTML->PDF rendering path suitable for signed PDF generation (e.g., token-based render endpoint or server-side HTML string rendering).
    status: completed
  - id: pdf-signing-utility
    content: Add a server-only PDF signing utility that produces a digitally signed PDF from PDF bytes using your X.509 keypair.
    status: completed
  - id: issuance-integration
    content: Update `app/actions/issue-certificate.ts` to generate+sign the PDF after blockchain issuance succeeds, and set `Certificate.pdfUrl`.
    status: completed
  - id: download-ui
    content: Update `app/dashboard/certificate/[slug]/page.tsx` to add a `Download Signed PDF` button; keep print as labeled fallback.
    status: completed
  - id: download-route
    content: Add a protected download endpoint/API route to stream the signed PDF to the authenticated certificate owner.
    status: completed
  - id: legacy-backfill
    content: Add a backfill strategy for existing ISSUED certificates lacking `pdfUrl` (on-demand or background/admin script).
    status: completed
  - id: verification-expectations
    content: "Document user-facing verification expectations: PDF signature validation works offline; QR+blockchain provides additional data authenticity."
    status: completed
isProject: false
---

# PDF Digital Signature Integration (Fully Tamper-Proof UX)

## Goal

Deliver certificates as **server-generated PDFs that are digitally signed (X.509 / CMS / PAdES-style)**. After signing, any alteration of the PDF content (including the printed name) breaks signature validation.

Your existing QR + blockchain flow remains, but the primary tamper-proof guarantee becomes the **PDF signature**.

## Non-goals

- Do not change `contracts/`* or `typechain-types/`*.
- Do not rely on QR/web verification for “PDF tamper proof” (signature covers that).

## Key UX Decisions (assumed from your answers)

- Deliver as **Download Signed PDF** (server-generated) rather than relying on `window.print()`.
- You do not yet have a signing certificate/key; the architecture includes provisioning.

## Architecture Overview

```mermaid
flowchart TD
  claimAction[claimCertificate()] --> issueAction[issueCertificate()] 
  issueAction --> certDB[prisma.certificate update(blockchain fields)]
  certDB --> pdfGen[generate certificate PDF bytes]
  pdfGen --> pdfSign[digital-sign PDF using X.509 keypair]
  pdfSign --> storePdf[upload/store PDF; set Certificate.pdfUrl]
  storePdf --> uiDownload[Certificate page: Download Signed PDF]

  scanQr[Scan QR] --> verifyQR[verification page + verifyCertificate mode:"qr"]
  offlineVerify[Open PDF in Acrobat/reader] --> pdfReaderSig[PDF signature validation]
```



## Phase 1 — Signing setup & key management

### 1.1 Provision signing materials

- Create an internal Certificate Authority or use an existing organization-issued code/signing cert.
- Produce:
  - `SIGNING_PRIVATE_KEY_PEM` (private key)
  - `SIGNING_CERT_PEM` (signer certificate)
  - optional `SIGNING_CERT_CHAIN_PEM` (intermediates)

### 1.2 Store secrets securely

- Add them to server environment (never on client):
  - `SIGNING_PRIVATE_KEY_PEM`
  - `SIGNING_CERT_PEM`
  - (optional) `SIGNING_CERT_CHAIN_PEM`
- Ensure logs never print keys.

## Phase 2 — PDF generation pipeline

### 2.1 Decide generation method (recommended)

Recommended default:

- Use **Playwright** (or another headless Chromium renderer) to convert a “certificate HTML preview” page into PDF bytes.

Rationale for your current codebase:

- Your certificate is currently rendered via `app/dashboard/certificate/[slug]/CertificateTemplate.tsx` with complex CSS + QR SVG.
- Browser-based rendering preserves your existing design.

### 2.2 Add an internal “render without auth” HTML endpoint (or token)

Because certificate pages currently require authenticated access (`requireUser()` in the server page data fetch), PDF generation needs a safe way to render.

Add one of these:

- **Option A (preferred):** `/api/certificates/[certificateId]/render?token=...`
  - Server verifies a short-lived token that maps to the certificate.
  - Endpoint returns certificate HTML only (no sensitive data beyond what’s already on the certificate).
- **Option B:** Generate HTML string directly from React on the server.
  - More work now because fonts/images/next/image assets may require special handling.

## Phase 3 — PDF signing implementation

### 3.1 Add signing utility module

Create a server-only helper that:

1. Accepts `pdfBytes: Buffer`
2. Adds an appropriate signature placeholder/field
3. Signs with your X.509 keypair
4. Returns signed `signedPdfBytes: Buffer`

Implementation detail to choose:

- Use a library such as `node-signpdf` / `@signpdf/`* (PAdES/CMS PDF signatures) to produce a standards-compatible signature.
- Ensure signature is applied such that any PDF content change invalidates it.

### 3.2 Embed signature metadata

- Include signer name/organization visible in PDF signature panel.
- Optionally stamp the verification URL or `uniqueId` in the PDF footer/header (you already show `certDisplayId` and QR).

## Phase 4 — Integrate into certificate issuance

### 4.1 Generate & sign after issuance succeeds

Best insertion point:

- After on-chain issuance succeeds and the certificate DB row is updated.

Most practical integration flow:

- In `app/actions/issue-certificate.ts` (after `blockchainStatus: "ISSUED"` update succeeds):
  - Generate PDF for the certificate
  - Sign PDF
  - Upload/store PDF
  - Update `Certificate.pdfUrl` (field already exists in your Prisma model)

Alternative:

- In `app/actions/claim-certificate.ts` after `issueCertificate(...)` returns.
- This is more dependent on what `issueCertificate` currently returns (it currently returns `void`), so you’d likely add/adjust internal return values.

### 4.2 Store the signed PDF

- Update `prisma.certificate.update({ data: { pdfUrl: ... } })`.
- Use private S3 object + signed URL for download, or generate-and-stream directly.

Recommended:

- Store in S3 and set `pdfUrl` to a short-lived signed URL, regenerated on download.
- Or store a persistent object key and compute a signed download URL in a download endpoint.

## Phase 5 — UI changes: Download Signed PDF

### 5.1 Add a download button to certificate page

In `app/dashboard/certificate/[slug]/page.tsx` where you currently render:

- `BackToCourseButton`
- `CertificatePrintButton` (browser print)

Replace/extend with:

- `Download Signed PDF` button
- Keep `Print Certificate` as fallback, but label it “Unsigned (not tamper-proof)” to avoid confusion.

### 5.2 Add download endpoint

Add a new route (API handler) that:

- Verifies the user owns the certificate
- Retrieves the signed PDF bytes (from S3 or regenerated)
- Streams them with `Content-Disposition: attachment; filename=...pdf`

## Phase 6 — QR & blockchain verification remains (secondary)

Your current QR flow already verifies the on-chain hash derived from the embedded snapshot:

- `app/verification/page.tsx` reads `?cid=` or `?qr=`
- `app/actions/verify-certificate.ts` recomputes hash from QR JSON and checks on-chain

Keep this:

- It proves the certificate data snapshot matches blockchain.

But crucially:

- PDF signature proves the PDF itself wasn’t altered.

## Phase 7 — Backfill for legacy certificates

Existing certificates may not have `pdfUrl`.

Add a backfill strategy:

- When a user views a certificate without `pdfUrl`, optionally show “Generate signed PDF” (server background job) or generate on-demand.
- Or run a one-time admin script after deployment to generate signed PDFs for all ISSUED certificates where `pdfUrl` is null.

## Phase 8 — Verification expectations (what users will see)

- Offline tamper-proof check: open PDF in a standard PDF viewer (Acrobat / macOS Preview / etc.). Signature should show “Valid” or “Tampered”.
- If users do not have the signer cert in their trust store, some viewers may warn, but the cryptographic integrity check still applies.

## Concrete change inventory (files you’ll likely touch)

High-level:

- `app/actions/issue-certificate.ts` (generate/sign/store after on-chain success)
- `app/dashboard/certificate/[slug]/page.tsx` (UI: download button)
- `app/dashboard/certificate/[slug]/CertificatePrintButton.tsx` (optional rename/label or keep)
- Add new server-only modules under `lib/` (PDF render + sign)
- Add a new API route to download PDF (and possibly a render endpoint)

## Risk & constraints

- PDF rendering must be consistent so the signed PDF matches what users see.
- Signing requires correct certificate/key provisioning and supported library behavior.
- Performance: signing+rendering can be slow; consider background jobs or generate on-demand.

## Recommended rollout

1. Deploy signing pipeline behind a feature flag.
2. Generate signed PDFs for new claims first.
3. Backfill legacy ones gradually.
4. Verify tamper-proof behavior by editing the PDF name and confirming signature invalidation.

## Test plan (manual)

- Create a new certificate.
- Download signed PDF.
- Open in Acrobat/reader and confirm signature validity.
- Modify the name inside the PDF and confirm signature becomes invalid.
- Scan QR and confirm verification still works.

