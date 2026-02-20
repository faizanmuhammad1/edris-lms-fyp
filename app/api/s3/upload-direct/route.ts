import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "@/lib/S3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export const maxDuration = 60; // Set max duration for large uploads

// Next.js config to allow large file uploads
// Note: In Next.js 15+ App Router, body size limit is handled differently depending on environment,
// but adding it here helps with some deployment platforms
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: "5000mb",
  },
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // const user = await prisma.user.findUnique({
  //   where: { email: session.user.email },
  //   select: { role: true },
  // });

  // Role check removed to allow students to upload assignments

  const formData = await request.formData();
  const file = formData.get("file") as File;

  try {
    const decision = await aj.protect(request, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size and type for documents
    const isImage = file.type.startsWith("image/");
    const isDocument =
      file.type === "application/pdf" ||
      file.type === "application/x-pdf" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.type === "application/x-compressed" ||
      file.type === "multipart/x-zip" ||
      file.type === "application/x-rar-compressed" ||
      file.type === "application/octet-stream";
    const maxSize = isImage
      ? 5 * 1024 * 1024
      : isDocument
        ? 50 * 1024 * 1024 // 50MB for documents
        : 5000 * 1024 * 1024; // 5GB for videos
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds limit" },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = file.name;
    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: file.type,
      ContentLength: file.size,
      Key: uniqueKey,
      Body: Buffer.from(fileBuffer),
    });

    await S3.send(command);

    return NextResponse.json({
      key: uniqueKey,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}

