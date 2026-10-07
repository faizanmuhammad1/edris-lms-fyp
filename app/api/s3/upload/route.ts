import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { requireTeacher } from "@/app/data/teacher/require-teacher";

const fileUploadSchema = z.object({
  fileName: z.string().min(1, { message: "Filename is required" }),
  contentType: z.string().min(1, { message: "Content type is required" }),
  size: z.number().int().min(1, { message: "Size is required" }),
  isImage: z.boolean(),
});

// Mirrors the client-side limits in components/file-uploader/Uploader.tsx.
// ContentLength is signed into the URL, so the PUT must match the validated size.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 5000 * 1024 * 1024;
const MAX_OTHER_BYTES = 50 * 1024 * 1024;

function maxBytesFor(contentType: string): number {
  if (contentType.startsWith("image/")) return MAX_IMAGE_BYTES;
  if (contentType.startsWith("video/")) return MAX_VIDEO_BYTES;
  return MAX_OTHER_BYTES;
}

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 50,
  })
);

export async function POST(request: Request) {
  const session = await requireTeacher();
  try {
    const decision = await aj.protect(request, {
      fingerprint: session?.user.id as string,
    });

    if (decision.isDenied()) {
      return NextResponse.json({ error: "dudde not good" }, { status: 429 });
    }

    const body = await request.json();

    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid Request Body" },
        { status: 400 }
      );
    }

    const { fileName, contentType, size } = validation.data;

    const maxBytes = maxBytesFor(contentType);
    if (size > maxBytes) {
      return NextResponse.json(
        { error: `File size exceeds limit (max ${Math.round(maxBytes / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: contentType,
      ContentLength: size,
      Key: uniqueKey,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // URL expires in 6 minutes
    });

    const response = {
      presignedUrl,
      key: uniqueKey,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
