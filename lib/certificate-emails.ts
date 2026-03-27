"use server";

import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { env } from "@/lib/env";
import { buildCertificatePayload } from "@/lib/blockchain";
import {
  certificateIssuedEmail,
  courseCompletionCongratsEmail,
} from "@/lib/email-templates";
import { getServerBaseUrl } from "@/lib/base-url";

export async function sendCourseCompletionEmailIfNeeded(params: {
  userId: string;
  courseId: string;
}): Promise<void> {
  const { userId, courseId } = params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });
  if (!course) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  if (!user) return;

  const certificate = await prisma.certificate.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {
      recipientName: {
        set: user.name,
      },
    },
    create: {
      userId,
      courseId,
      recipientName: user.name,
    },
    select: {
      id: true,
      completionEmailSentAt: true,
    },
  });

  if (certificate.completionEmailSentAt) return;

  const appUrl = getServerBaseUrl();
  const certificateUrl = `${appUrl}/dashboard/certificate/${course.slug}`;

  await resend.emails.send({
    from: env.EMAIL_FROM ?? "Edris LMS <onboarding@resend.dev>",
    to: [user.email],
    subject: `Congratulations! You completed ${course.title}`,
    html: courseCompletionCongratsEmail({
      studentName: user.name,
      courseName: course.title,
      certificateUrl,
    }),
  });

  await prisma.certificate.update({
    where: { id: certificate.id },
    data: { completionEmailSentAt: new Date() },
  });
}

export async function sendCertificateIssuedEmailIfNeeded(params: {
  certificateId: string;
}): Promise<void> {
  const { certificateId } = params;

  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: {
      id: true,
      uniqueId: true,
      issuedAt: true,
      recipientName: true,
      txHash: true,
      network: true,
      blockchainStatus: true,
      issuedEmailSentAt: true,
      qrData: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
      Course: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!certificate) return;
  if (certificate.blockchainStatus !== "ISSUED") return;

  if (!certificate.qrData) {
    const { qrData } = await buildCertificatePayload({
      uniqueId: certificate.uniqueId,
      studentName: certificate.recipientName ?? certificate.User.name ?? "",
      courseName: certificate.Course.title,
      issuedAt: certificate.issuedAt,
    });

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { qrData },
    });
  }

  if (certificate.issuedEmailSentAt) return;

  const appUrl = getServerBaseUrl();
  const verificationUrl = `${appUrl}/verification?cid=${certificate.uniqueId}`;
  const explorerBase = process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? "https://amoy.polygonscan.com";
  const txUrl = certificate.txHash ? `${explorerBase}/tx/${certificate.txHash}` : null;

  await resend.emails.send({
    from: env.EMAIL_FROM ?? "Edris LMS <onboarding@resend.dev>",
    to: [certificate.User.email],
    subject: `Certificate issued: ${certificate.Course.title}`,
    html: certificateIssuedEmail({
      studentName: certificate.User.name,
      courseName: certificate.Course.title,
      certificateId: certificate.uniqueId,
      verificationUrl,
      txUrl,
      network: certificate.network,
    }),
  });

  await prisma.certificate.update({
    where: { id: certificate.id },
    data: { issuedEmailSentAt: new Date() },
  });
}

