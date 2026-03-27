# Blockchain-Based Certification and Verification: Achievements in Edris LMS

## 1. Overview
This document summarizes what has been successfully implemented in the Edris LMS platform for blockchain-based certificate issuance and verification.

The delivered system provides:
- On-chain certificate authenticity verification on Polygon Amoy.
- Cryptographic tamper detection using deterministic payload hashing.
- Public verification access through an IPFS-hosted verifier page.
- End-to-end integration between LMS data, blockchain records, and user-facing verification interfaces.

## 2. Problem Addressed
Traditional digital certificates can be copied, edited, or re-issued without strong proof of authenticity. The platform addresses this by:
- Anchoring certificate integrity on blockchain.
- Verifying certificate data against an immutable on-chain hash.
- Exposing verification to external users without requiring platform login.

## 3. Core Technical Achievements

### 3.1 Canonical Certificate Payload Hashing
A deterministic payload model is implemented so that the same certificate data always produces the same hash.

Canonical payload fields:
- courseName
- issuedAt (ISO UTC)
- studentName
- uniqueId

Technical outcomes:
- Stable serialization strategy prevents key-order drift.
- Identical payloads produce identical hashes across issuance and verification paths.
- Reduced false tamper detection caused by inconsistent local hashing logic.

### 3.2 On-Chain Verification Integration
The verifier consumes smart contract functions that prove whether a certificate exists and whether provided data is authentic.

Integrated contract checks:
- isIssued(certificateId)
- verifyCertificate(certificateId, payloadHash)

Verification output includes:
- Valid / tampered status.
- Issuer address.
- Issuance event context (transaction hash, block number when available).

### 3.3 IPFS-Based Public Verifier
A standalone verifier page was implemented and hosted through IPFS-compatible URLs.

Key capabilities:
- Upload certificate PDF.
- Extract Student Name, Course Name, Certificate ID, and Issued At values.
- Recompute payload hash in-browser.
- Verify directly against Polygon Amoy.

Result:
- Verification can be performed from a decentralized/public endpoint without LMS authentication.

### 3.4 QR Verification URL Migration
QR data generation was updated to point to an IPFS verifier URL.

Result:
- Scanning certificate QR codes opens the public blockchain verifier endpoint.
- Improves portability and external trust for third-party verifiers.

### 3.5 Course Name Normalization Strategy
A normalization layer was introduced to robustly map extracted course names to canonical LMS titles.

Implemented capabilities:
- Normalized marker generation for course titles.
- Course.normalizedName persistence and indexing in the database schema.
- Resolver API endpoint to convert marker values back to real course names.
- Backward compatibility behavior for legacy records.

Result:
- Better resilience against extraction artifacts and spacing/casing differences.
- Higher verification success for real-world PDF text extraction variance.

### 3.6 Runtime Resilience for Partial Migrations
The course resolver endpoint now handles environments where normalizedName is not yet migrated.

Result:
- Avoids hard runtime failure in pre-migration deployments.
- Falls back to legacy matching behavior when required.

### 3.7 Hydration and Frontend Consistency Improvements
Certificate rendering paths were updated to remove client/server timestamp drift that caused hydration mismatch.

Result:
- Stable UI rendering for certificate metadata fields.
- Reduced rendering inconsistencies in verification-related views.

## 4. Security and Integrity Outcomes
The implemented design provides the following security properties:
- Tamper Evidence: Any data modification changes the hash and fails verification.
- Immutability: Verification source of truth is stored on blockchain.
- Public Auditability: Anyone can verify through RPC + explorer references.
- Deterministic Validation: Same canonical data yields same verification result.

## 5. User-Facing Outcomes Achieved
From an end-user perspective, the platform now supports:
- Issuing blockchain-backed certificates.
- Displaying certificate metadata required for transparent verification.
- Verifying certificates through a QR-to-IPFS workflow.
- Manual correction of extraction fields when OCR/PDF parsing is imperfect.
- Receiving clear states: Verified, Not Found, Tampered, or Error.

## 6. Architectural Milestones
The following platform-level milestones were completed:
- Integration of LMS certificate lifecycle with blockchain verification state.
- Consolidated canonical hashing utility shared by issuance and verification logic.
- Public verifier deployment model aligned with decentralized hosting (IPFS URL flow).
- Verification UX wiring in certificate surfaces and platform navigation.

## 7. Current Scope and Practical Boundaries
Current implementation scope:
- Network target: Polygon Amoy.
- Verification target: certificate authenticity against on-chain payload hash.

Known practical boundary:
- If backend course-title resolution is unreachable from a hosted verifier context, local fallback formatting is used; therefore consistent canonical naming remains important for perfect match rates.

## 8. Thesis-Ready Contribution Statement
The Edris LMS platform has successfully implemented a production-oriented blockchain certificate framework where certificate authenticity is cryptographically anchored on-chain and verified through a public, IPFS-accessible workflow.

This demonstrates a complete applied pipeline from LMS issuance to decentralized third-party verification, including deterministic hashing, smart contract checks, robustness handling for real-world extraction noise, and user-facing trust transparency.

## 9. Suggested Thesis Keywords
- Blockchain certificate verification
- Tamper-proof digital credentials
- Canonical payload hashing
- Smart contract authenticity checks
- IPFS-based public verifier
- Decentralized trust in LMS
