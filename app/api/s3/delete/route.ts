import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import arcjet, { fixedWindow } from "@/lib/arcjet";

import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { S3 } from "@/lib/S3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 50,
  })
);

const deleteSchema = z.object({ key: z.string().min(1).max(1024) });

/**
 * A key may be deleted by an admin, by the owner of whatever record references it,
 * or by anyone when no record references it yet (a fresh upload being discarded).
 */
async function canDeleteKey(key: string, userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "admin") return true;

  // Assignment uploads live under submissions/<userId>/; only their uploader may delete them.
  if (key.startsWith("submissions/") && !key.startsWith(`submissions/${userId}/`)) {
    return false;
  }

  const [courses, lessons, attachments, submissions] = await Promise.all([
    prisma.course.findMany({
      where: { fileKey: key },
      select: { userId: true },
    }),
    prisma.lesson.findMany({
      where: { OR: [{ videoKey: key }, { thumbnailKey: key }, { pdfKey: key }] },
      select: { Chapter: { select: { Course: { select: { userId: true } } } } },
    }),
    prisma.lessonAttachment.findMany({
      where: { fileKey: key },
      select: {
        Lesson: {
          select: { Chapter: { select: { Course: { select: { userId: true } } } } },
        },
      },
    }),
    prisma.assignmentSubmission.findMany({
      where: { fileKey: key },
      select: { userId: true },
    }),
  ]);

  const ownerIds = [
    ...courses.map((c) => c.userId),
    ...lessons.map((l) => l.Chapter.Course.userId),
    ...attachments.map((a) => a.Lesson.Chapter.Course.userId),
    ...submissions.map((s) => s.userId),
  ];

  return ownerIds.every((ownerId) => ownerId === userId);
}

export async function DELETE(request: Request) {
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
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const parsed = deleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing or invalid object key" },
        { status: 400 }
      );
    }
    const { key } = parsed.data;

    if (!(await canDeleteKey(key, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await S3.send(
      new DeleteObjectCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Key: key,
      })
    );

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
