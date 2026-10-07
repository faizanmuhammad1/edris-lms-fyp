"use server";

import { prisma } from "@/lib/db";
import {
  buildPayloadFromQR,
  computeCertificatePayloadHash,
  verifyCertificateOnChain,
} from "@/lib/blockchain";

export type VerificationResult =
  | {
      isValid: true;
      certificate: {
        studentName:     string;
        courseName:      string;
        issuedAt:        Date;
        uniqueId:        string;
        txHash:          string;
        blockNumber:     string | null;
        network:         string | null;
        contractAddress: string | null;
        explorerUrl:     string;
      };
      onChain: {
        storedHash: string;
        issuedAt:   number;
        issuer:     string;
      };
    }
  | {
      isValid: false;
      error: string;
      certificate?: {
        studentName: string;
        courseName:  string;
        issuedAt:    Date;
        uniqueId:    string;
        status:      string | null;
      };
    };

export async function verifyCertificate(
  input: {
    mode: "qr" | "id";
    qrData?: string;
    uniqueId?: string;
  }
): Promise<VerificationResult> {
  try {
    let parsed: {
      studentName: string;
      courseName: string;
      issuedAt: string;
      uniqueId: string;
    };
    let payloadHash: string;
    let txHash: string | null = null;
    let blockNumber: bigint | null = null;
    let network: string | null = null;
    let contractAddress: string | null = null;

    function qrDataToJson(qrData: string): string {
      const trimmed = qrData.trim();

      // Legacy: raw JSON stored in DB
      if (trimmed.startsWith("{")) return trimmed;

      // New format: full URL that contains ?qr=<encodedJson>
      try {
        const url = new URL(trimmed);
        const param = url.searchParams.get("qr");
        if (param) return param; // URLSearchParams returns decoded value
      } catch {
        // ignore and fall through
      }

      // Best-effort manual extraction
      const match = trimmed.match(/[?&]qr=([^&]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);

      // Last resort: return as-is (will fail JSON.parse if it isn't JSON)
      return trimmed;
    }

    if (input.mode === "qr" && input.qrData) {
      const qrDataString = qrDataToJson(input.qrData);
      const parsedQr = JSON.parse(qrDataString) as { id?: string };
      if (parsedQr.id) {
        const cert = await prisma.certificate.findUnique({
          where: { uniqueId: parsedQr.id },
          select: {
            txHash: true,
            blockNumber: true,
            network: true,
            contractAddress: true,
          },
        });
        txHash = cert?.txHash ?? null;
        blockNumber = cert?.blockNumber ?? null;
        network = cert?.network ?? null;
        contractAddress = cert?.contractAddress ?? null;
      }

      const qrPayload = await buildPayloadFromQR(qrDataString);
      payloadHash = qrPayload.payloadHash;
      parsed = qrPayload.parsed;
    } else if (input.mode === "id" && input.uniqueId) {
      const cert = await prisma.certificate.findUnique({
        where: { uniqueId: input.uniqueId },
        include: {
          User: { select: { name: true } },
          Course: { select: { title: true } },
        },
      });

      if (!cert) {
        return { isValid: false, error: "Certificate not found" };
      }

      if (cert.blockchainStatus !== "ISSUED") {
        return {
          isValid: false,
          error: "Certificate not yet recorded on blockchain",
          certificate: {
            studentName: cert.recipientName ?? cert.User.name ?? "",
            courseName: cert.courseName ?? cert.Course.title,
            issuedAt: cert.issuedAt,
            uniqueId: cert.uniqueId,
            status: cert.blockchainStatus,
          },
        };
      }

      parsed = {
        studentName: cert.recipientName ?? cert.User.name ?? "",
        courseName: cert.courseName ?? cert.Course.title,
        issuedAt: cert.issuedAt.toISOString(),
        uniqueId: cert.uniqueId,
      };

      payloadHash = computeCertificatePayloadHash(parsed).payloadHash;
      txHash = cert.txHash;
      blockNumber = cert.blockNumber ?? null;
      network = cert.network ?? null;
      contractAddress = cert.contractAddress ?? null;
    } else {
      return { isValid: false, error: "Invalid verification input" };
    }

    const onChainResult = await verifyCertificateOnChain(
      parsed.uniqueId,
      payloadHash
    );

    const explorerBase =
      process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? "https://amoy.polygonscan.com";

    if (!onChainResult.isValid) {
      return {
        isValid: false,
        error:
          "Certificate data has been tampered with. Hash does not match blockchain record.",
      };
    }

    return {
      isValid: true,
      certificate: {
        studentName: parsed.studentName,
        courseName: parsed.courseName,
        issuedAt: new Date(parsed.issuedAt),
        uniqueId: parsed.uniqueId,
        txHash: txHash ?? "",
        blockNumber: blockNumber?.toString() ?? null,
        network,
        contractAddress,
        explorerUrl: txHash
          ? `${explorerBase}/tx/${txHash}`
          : `${explorerBase}/address/${contractAddress ?? ""}`,
      },
      onChain: {
        storedHash: onChainResult.storedHash,
        issuedAt: onChainResult.issuedAt,
        issuer: onChainResult.issuer,
      },
    };
  } catch (err) {
    console.error("Verification error:", err);
    return {
      isValid: false,
      error: "Verification failed. Please try again.",
    };
  }
}
