import "server-only";

import { ethers } from "ethers";
import { prisma } from "@/lib/db";
import {
  buildCertificatePayload,
  findCertificateOnChain,
  issueCertificateOnChain,
} from "@/lib/blockchain";
import { sendCertificateIssuedEmailIfNeeded } from "@/lib/certificate-emails";
import { verificationPortalUrl } from "@/lib/verification-portal-url";

/**
 * Anchors a certificate on-chain using the name and course title persisted on the
 * certificate row, so the hash can always be recomputed for verification.
 * Not a server action: callers must authorize the user first.
 */
export async function issueCertificate(certificateDbId: string): Promise<void> {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateDbId },
      select: {
        id: true,
        uniqueId: true,
        issuedAt: true,
        recipientName: true,
        courseName: true,
        blockchainStatus: true,
        txHash: true,
        User: { select: { name: true } },
        Course: { select: { title: true } },
      },
    });

    if (!certificate) return;

    // Avoid re-issuing if already recorded.
    if (certificate.blockchainStatus === "ISSUED") return;

    const courseName = certificate.courseName ?? certificate.Course.title;
    const { payloadHash, qrData } = await buildCertificatePayload({
      uniqueId: certificate.uniqueId,
      studentName: certificate.recipientName ?? certificate.User.name,
      courseName,
      issuedAt: certificate.issuedAt,
    });

    // A previous attempt may have mined the transaction but failed before saving it.
    const existing = await findCertificateOnChain(certificate.uniqueId);
    let txHash: string | null;
    let blockNumber: number | null;
    if (existing.exists) {
      if (existing.storedHash !== payloadHash) {
        throw new Error(
          "Certificate ID is already anchored on-chain with different details"
        );
      }
      txHash = existing.txHash;
      blockNumber = existing.blockNumber;
    } else {
      const onChainResult = await issueCertificateOnChain(
        certificate.uniqueId,
        payloadHash
      );
      txHash = onChainResult.txHash;
      blockNumber = onChainResult.blockNumber;
    }

    const issuerAddress = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY as string).address;

    const contractAddress = process.env.CONTRACT_ADDRESS ?? null;

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        courseName,
        payloadHash,
        qrData,
        txHash,
        blockNumber: blockNumber === null ? null : BigInt(blockNumber),
        chainId: 80002,
        network: "amoy",
        contractAddress,
        issuerAddress,
        blockchainStatus: "ISSUED",
        verificationUrl: verificationPortalUrl(),
      },
    });

    // The certificate is already issued; an email failure must not mark it FAILED.
    try {
      await sendCertificateIssuedEmailIfNeeded({
        certificateId: certificate.id,
      });
    } catch (emailErr) {
      console.error("Certificate issued but notification email failed:", emailErr);
    }
  } catch (err) {
    console.error("Certificate on-chain issuance failed:", err);
    try {
      await prisma.certificate.update({
        where: { id: certificateDbId },
        data: { blockchainStatus: "FAILED" },
      });
    } catch (updateErr) {
      console.error("Failed to mark certificate as FAILED:", updateErr);
    }
    throw err;
  }
}
