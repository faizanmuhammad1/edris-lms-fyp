import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { S3 } from "@/lib/S3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import {
  ASSIGNMENT_MAX_FILE_BYTES_DEFAULT,
  parseAllowedFileTypes,
  resolveAssignmentUploadMime,
} from "@/lib/zodSchemas";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export const maxDuration = 60;

/**
 * Serverless platforms (e.g. Vercel ~4.5MB) cap function request bodies, so files proxied
 * through this route must stay small. Assignment uploads use a presigned PUT URL instead.
 */
const DIRECT_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

const assignmentUploadSchema = z.object({
  assignmentId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  contentType: z.string().max(255).optional(),
  size: z.number().int().positive(),
});

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "images",
  word: "Word documents",
  text: "text files",
  zip: "ZIP archives",
};

/**
 * POST /api/s3/upload-direct?useCase=assignment
 *   JSON { assignmentId, fileName, contentType, size } -> { presignedUrl, key, contentType }
 *   Caller must have an Active enrollment in the assignment's course; type/size are
 *   validated against the assignment's allowedFileTypes / maxFileSizeBytes.
 *
 * POST /api/s3/upload-direct (multipart "file")
 *   Small file proxied through the server. Teachers/admins only.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decision = await aj.protect(request, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const url = new URL(request.url);
    if (url.searchParams.get("useCase") === "assignment") {
      return await createAssignmentUploadUrl(request, session.user.id);
    }

    return await proxyStaffUpload(request, session.user.id);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

async function createAssignmentUploadUrl(request: Request, userId: string) {
  let body: z.infer<typeof assignmentUploadSchema>;
  try {
    body = assignmentUploadSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: body.assignmentId,
      Lesson: {
        Chapter: {
          Course: {
            enrollment: { some: { userId, status: "Active" } },
          },
        },
      },
    },
    select: { allowFile: true, allowedFileTypes: true, maxFileSizeBytes: true },
  });

  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found or you are not enrolled" },
      { status: 403 }
    );
  }

  if (!assignment.allowFile) {
    return NextResponse.json(
      { error: "This assignment does not accept file uploads" },
      { status: 400 }
    );
  }

  const maxBytes = assignment.maxFileSizeBytes ?? ASSIGNMENT_MAX_FILE_BYTES_DEFAULT;
  if (body.size > maxBytes) {
    return NextResponse.json(
      { error: `File size exceeds limit (max ${Math.round(maxBytes / 1024 / 1024)}MB)` },
      { status: 400 }
    );
  }

  const contentType = resolveAssignmentUploadMime(
    body.fileName,
    body.contentType,
    assignment.allowedFileTypes
  );
  if (!contentType) {
    const labels = parseAllowedFileTypes(assignment.allowedFileTypes)
      .map((t) => TYPE_LABELS[t] ?? t)
      .join(", ");
    return NextResponse.json(
      { error: `File type not allowed for this assignment. Accepted: ${labels}` },
      { status: 400 }
    );
  }

  const safeName = body.fileName.replace(/[\\/]/g, "_");
  const key = `submissions/${userId}/${uuidv4()}-${safeName}`;

  // ContentLength is signed, so the PUT must match the validated size.
  const command = new PutObjectCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    ContentType: contentType,
    ContentLength: body.size,
    Key: key,
  });

  const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 600 });

  return NextResponse.json({ presignedUrl, key, contentType });
}

async function proxyStaffUpload(request: Request, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, teacherStatus: true, banned: true },
  });
  const isStaff =
    user?.role === "admin" || user?.role === "teacher" || user?.teacherStatus === "Approved";
  if (!user || user.banned === true || !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Reject oversized bodies before buffering them
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > DIRECT_UPLOAD_MAX_BYTES + 64 * 1024) {
    return NextResponse.json(
      { error: `File size exceeds limit (max ${DIRECT_UPLOAD_MAX_BYTES / 1024 / 1024}MB)` },
      { status: 413 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

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

  if (!isImage && !isDocument) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (file.size > DIRECT_UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: `File size exceeds limit (max ${DIRECT_UPLOAD_MAX_BYTES / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  const fileBuffer = await file.arrayBuffer();
  const uniqueKey = `${uuidv4()}-${file.name}`;

  await S3.send(
    new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: file.type,
      ContentLength: file.size,
      Key: uniqueKey,
      Body: Buffer.from(fileBuffer),
    })
  );

  return NextResponse.json({
    key: uniqueKey,
    message: "File uploaded successfully",
  });
}
