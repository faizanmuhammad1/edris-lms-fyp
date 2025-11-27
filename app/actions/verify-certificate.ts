"use server";

import { CertificateItem } from "@/app/data/user/get-certificates";

// Mock database of valid certificates
// In a real app, this would query your database or blockchain
const MOCK_CERTIFICATES: CertificateItem[] = [
    {
        certificateId: "CERT-2025-ABC123",
        courseTitle: "Introduction to Next.js",
        courseSlug: "introduction-to-nextjs",
        issuedOn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        certificateId: "CERT-2025-DEF456",
        courseTitle: "TypeScript Basics",
        courseSlug: "typescript-basics",
        issuedOn: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        certificateId: "CERT-2025-GHI789",
        courseTitle: "React State Management",
        courseSlug: "react-state-management",
        issuedOn: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export type VerificationResult =
    | { success: true; certificate: CertificateItem }
    | { success: false; error: string };

export async function verifyCertificate(hash: string): Promise<VerificationResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!hash) {
        return { success: false, error: "Please enter a certificate hash." };
    }

    const normalizedHash = hash.trim().toUpperCase();

    // Check if it matches our specific mock data
    const found = MOCK_CERTIFICATES.find((c) => c.certificateId === normalizedHash);

    if (found) {
        return { success: true, certificate: found };
    }

    if (normalizedHash.startsWith("CERT-TEST-")) {
        return {
            success: true,
            certificate: {
                certificateId: normalizedHash,
                courseTitle: "Demo Verified Course",
                courseSlug: "demo-verified-course",
                issuedOn: new Date().toISOString()
            }
        }
    }

    return { success: false, error: "Certificate not found or invalid hash." };
}
