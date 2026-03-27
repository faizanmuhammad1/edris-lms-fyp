"use server";

import { ethers } from "ethers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import {
  buildCertificatePayload,
  issueCertificateOnChain,
} from "@/lib/blockchain";
import { sendCertificateIssuedEmailIfNeeded } from "@/lib/certificate-emails";
import { getServerBaseUrl } from "@/lib/base-url";
import { S3 } from "@/lib/S3Client";
import { env } from "@/lib/env";
import { renderCertificateToPdf } from "@/lib/pdf/render-certificate";
import { signPdfBytes } from "@/lib/pdf/signing";

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

    // Best-effort: generate and digitally sign the PDF.
    // If signing is not configured (missing env vars), issuance should still succeed.
    try {
      const pdfBytes = await renderCertificateToPdf(certificate.uniqueId);
      const signedPdfBytes = await signPdfBytes(pdfBytes);

      const s3Key = `certificates/${certificate.uniqueId}.signed.pdf`;
      const putCommand = new PutObjectCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Key: s3Key,
        ContentType: "application/pdf",
        Body: signedPdfBytes,
      });

      await S3.send(putCommand);

      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { pdfUrl: s3Key },
      });
    } catch (pdfErr) {
      console.error(
        "Failed to generate/upload digitally signed PDF:",
        pdfErr
      );
    }

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

