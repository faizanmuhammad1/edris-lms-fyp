import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  lessonId: z.string().uuid(),
  fileKey: z.string().min(1),
  disposition: z.enum(["inline", "attachment"]).optional(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { lessonId, fileKey, disposition } = body;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      pdfKey: true,
      attachments: { select: { fileKey: true } },
      Chapter: { select: { courseId: true } },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const allowedKeys = [
    lesson.pdfKey,
    ...lesson.attachments.map((a) => a.fileKey),
  ].filter(Boolean);
  if (!allowedKeys.includes(fileKey)) {
    return NextResponse.json(
      { error: "File not found for this lesson" },
      { status: 403 }
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: lesson.Chapter.courseId,
      },
    },
    select: { status: true },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return NextResponse.json(
      { error: "Enrollment required to access lesson files" },
      { status: 403 }
    );
  }

  const command = new GetObjectCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    Key: fileKey,
    ...(disposition && {
      ResponseContentDisposition:
        disposition === "attachment"
          ? `attachment; filename="${fileKey.split("/").pop() ?? "file"}"`
          : "inline",
    }),
  });

  const url = await getSignedUrl(S3, command, { expiresIn: 900 }); // 15 min

  return NextResponse.json({ url });
}
