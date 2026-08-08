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
  submissionId: z.string().uuid(),
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

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: body.submissionId },
    select: {
      id: true,
      userId: true,
      fileKey: true,
      fileName: true,
      Assignment: {
        select: {
          Lesson: {
            select: {
              Chapter: { select: { Course: { select: { userId: true } } } },
            },
          },
        },
      },
    },
  });

  if (!submission || !submission.fileKey) {
    return NextResponse.json({ error: "Submission or file not found" }, { status: 404 });
  }

  const courseUserId = submission.Assignment.Lesson.Chapter.Course.userId;
  const isTeacher = courseUserId === session.user.id;
  const isOwner = submission.userId === session.user.id;
  if (!isTeacher && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const command = new GetObjectCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    Key: submission.fileKey,
    ResponseContentDisposition: `attachment; filename="${submission.fileName ?? "submission"}"`,
  });

  const url = await getSignedUrl(S3, command, { expiresIn: 900 });
  return NextResponse.json({ url });
}
