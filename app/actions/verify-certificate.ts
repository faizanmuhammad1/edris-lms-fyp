"use server";

import { prisma } from "@/lib/db";
import {
  buildCertificatePayload,
  verifyCertificateOnChain,
} from "@/lib/blockchain";

export type VerificationResult =
  | {
      isValid: true;
      certificate: {
        studentName: string;
        courseName: string;
        issuedAt: Date;
        uniqueId: string;
        txHash: string;
        blockNumber: string | null;
        network: string | null;
        contractAddress: string | null;
        explorerUrl: string;
      };
      onChain: {
        storedHash: string;
        issuedAt: number;
        issuer: string;
      };
    }
  | {
      isValid: false;
      error: string;
      certificate?: {
        studentName: string;
        courseName: string;
        issuedAt: Date;
        uniqueId: string;
        status: string | null;
      };
    };

export async function verifyCertificate(
  uniqueId: string
): Promise<VerificationResult> {
  try {
    // 1. Find certificate in DB
    const cert = await prisma.certificate.findUnique({
      where: { uniqueId },
      include: {
        User: { select: { name: true } },
        Course: { select: { title: true } },
      },
    });

    if (!cert) {
      return { isValid: false as const, error: "Certificate not found" };
    }

    if (cert.blockchainStatus !== "ISSUED" || !cert.txHash) {
      return {
        isValid: false as const,
        error: "Certificate not yet recorded on blockchain",
        certificate: {
          studentName: cert.User.name,
          courseName: cert.Course.title,
          issuedAt: cert.issuedAt,
          uniqueId: cert.uniqueId,
          status: cert.blockchainStatus,
        },
      } as const;
    }

    // 2. Rebuild payload hash from DB data
    const { payloadHash } = await buildCertificatePayload({
      uniqueId: cert.uniqueId,
      studentName: cert.User.name ?? "",
      courseName: cert.Course.title,
      issuedAt: cert.issuedAt,
    });

    // 3. Verify on-chain
    const onChainResult = await verifyCertificateOnChain(
      cert.uniqueId,
      payloadHash
    );

    const explorerBase =
      process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? "https://amoy.polygonscan.com";
    const explorerUrl = `${explorerBase}/tx/${cert.txHash}`;

    return {
      isValid: onChainResult.isValid as VerificationResult["isValid"],
      certificate: {
        studentName: cert.User.name,
        courseName: cert.Course.title,
        issuedAt: cert.issuedAt,
        uniqueId: cert.uniqueId,
        txHash: cert.txHash,
        blockNumber: cert.blockNumber?.toString() ?? null,
        network: cert.network,
        contractAddress: cert.contractAddress,
        explorerUrl,
      },
      onChain: {
        storedHash: onChainResult.storedHash,
        issuedAt: onChainResult.issuedAt,
        issuer: onChainResult.issuer,
      },
    } as VerificationResult;
  } catch (err) {
    console.error("Verification error:", err);
    return {
      isValid: false as const,
      error: "Verification failed. Please try again.",
    } as VerificationResult;
  }
}
