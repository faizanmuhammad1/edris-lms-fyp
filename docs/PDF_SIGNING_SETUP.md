# PDF Digital Signatures Setup

This project supports “fully tamper-proof” certificates by **digitally signing the generated PDF**.

## What you need

Most Node PDF signature libraries (including the ones used here) expect a **P12/PFX** bundle for the signer.

You will provide the signer bundle through server environment variables.

## Environment variables

Add the following to your server environment (no `NEXT_PUBLIC_*`):

- `SIGNING_CERT_P12_BASE64` (required for signing)
  - Base64 encoded contents of your `.p12`/`.pfx` signing bundle
- `SIGNING_CERT_P12_PASSWORD` (optional)
  - Passphrase for the P12/PFX (if your bundle is password protected)
- `SIGNING_SIGNER_NAME` (optional, default: `Edris LMS`)
  - Displayed in the signature metadata
- `SIGNING_SIGNER_LOCATION` (optional, default: `EDRIS LMS`)
  - Displayed in the signature metadata
- `SIGNING_SIGNER_CONTACT` (optional, default: `onboarding@edrislms.com`)
  - Contact email shown in signature metadata

## Example: create a self-signed P12 (development)

If you don’t have a CA-issued certificate, you can create your own for testing:

1. Generate a private key
2. Generate a certificate
3. Convert to P12

Exact commands depend on your security requirements and OpenSSL availability, but a typical flow is:

```sh
openssl genrsa -out signer.key 2048
openssl req -new -x509 -key signer.key -out signer.crt -days 3650 -subj "/CN=EdrisLMS"
openssl pkcs12 -export -out signer.p12 -inkey signer.key -in signer.crt
```

Then base64 encode:

```sh
base64 -w 0 signer.p12
```

Paste the output into `SIGNING_CERT_P12_BASE64`.

## Rotation policy (recommended)

- Keep a short certificate lifetime for the signing cert.
- When rotating, deploy new env vars first.
- Re-generate signed PDFs going forward; you may keep older signed PDFs verifiable using their embedded signer certificate chain.

## How users verify (offline + QR)

1. **Offline PDF verification (primary)**
   - Download the signed PDF from the certificate page.
   - Open it in any standard PDF viewer (Adobe Acrobat Reader, macOS Preview, etc.).
   - The viewer should show the digital signature status.
   - If your organization’s signer certificate is not in the user’s trust store, the viewer may show a warning—this does not change the cryptographic integrity; it only affects trust UI.

2. **QR + blockchain verification (secondary)**
   - Scan the QR code on the certificate.
   - The verification page rebuilds the on-chain hash from the QR snapshot and checks it against the Polygon contract.
   - If someone edits the certificate content without updating the QR snapshot, blockchain verification will still reflect the original snapshot (hash matches). The PDF signature covers the actual PDF bytes that were downloaded.

