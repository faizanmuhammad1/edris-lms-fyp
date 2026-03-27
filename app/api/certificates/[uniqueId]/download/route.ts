import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { renderCertificateToPdf } from "@/lib/pdf/render-certificate";
import { signPdfBytes } from "@/lib/pdf/signing";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  const { uniqueId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cert = await prisma.certificate.findUnique({
    where: { uniqueId },
    select: { userId: true, pdfUrl: true, blockchainStatus: true },
  });

  if (!cert || cert.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!cert.pdfUrl) {
    // On-demand backfill: generate & sign if already issued.
    if (cert.blockchainStatus !== "ISSUED") {
      return NextResponse.json(
        { error: "Signed PDF not available yet" },
        { status: 404 }
      );
    }

    try {
      const pdfBytes = await renderCertificateToPdf(uniqueId);
      const signedPdfBytes = await signPdfBytes(pdfBytes);

      const s3Key = `certificates/${uniqueId}.signed.pdf`;
      const putCommand = new PutObjectCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Key: s3Key,
        ContentType: "application/pdf",
        Body: signedPdfBytes,
      });

      await S3.send(putCommand);

      await prisma.certificate.update({
        where: { uniqueId },
        data: { pdfUrl: s3Key },
      });

      return new NextResponse(new Uint8Array(signedPdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="certificate-${uniqueId}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      console.error("Signed PDF backfill error:", err);
      return NextResponse.json(
        { error: "Failed to generate signed PDF" },
        { status: 500 }
      );
    }
  }

  try {
    const command = new GetObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: cert.pdfUrl,
    });

    const result = await S3.send(command);
    if (!result.Body) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const bytes = await result.Body.transformToByteArray();
    const buffer = Buffer.from(bytes);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${uniqueId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Certificate PDF download error:", err);
    return NextResponse.json({ error: "Failed to download PDF" }, { status: 500 });
  }
}

