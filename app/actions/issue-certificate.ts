"use server";

import { ethers } from "ethers";
import { prisma } from "@/lib/db";
import {
  buildCertificatePayload,
  issueCertificateOnChain,
} from "@/lib/blockchain";
import { sendCertificateIssuedEmailIfNeeded } from "@/lib/certificate-emails";
import { getServerBaseUrl } from "@/lib/base-url";

export async function issueCertificate(certificateDbId: string, data: {
  uniqueId: string;
  studentName: string;
  courseName: string;
  issuedAt: Date;
}): Promise<void> {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateDbId },
      select: {
        id: true,
        uniqueId: true,
        issuedAt: true,
        blockchainStatus: true,
        txHash: true,
      },
    });

    if (!certificate) return;

    // Avoid re-issuing if already recorded.
    if (certificate.blockchainStatus === "ISSUED" && certificate.txHash) return;

    const { payloadHash, qrData } = await buildCertificatePayload({
      uniqueId: data.uniqueId,
      studentName: data.studentName,
      courseName: data.courseName,
      issuedAt: data.issuedAt,
    });

    const onChainResult = await issueCertificateOnChain(
      data.uniqueId,
      payloadHash
    );

    const issuerAddress = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY as string).address;

    const contractAddress = process.env.CONTRACT_ADDRESS ?? null;
    const appUrl = getServerBaseUrl();

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        payloadHash,
        qrData,
        txHash: onChainResult.txHash,
        blockNumber: BigInt(onChainResult.blockNumber),
        chainId: 80002,
        network: "amoy",
        contractAddress,
        issuerAddress,
        blockchainStatus: "ISSUED",
        verificationUrl: `${appUrl}/verification?cid=${certificate.uniqueId}`,
      },
    });

    await sendCertificateIssuedEmailIfNeeded({
      certificateId: certificate.id,
    });
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

