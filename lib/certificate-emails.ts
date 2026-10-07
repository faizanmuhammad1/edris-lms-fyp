import "server-only";

import { prisma } from "@/lib/db";
import { resend, DEFAULT_EMAIL_FROM } from "@/lib/resend";
import { env } from "@/lib/env";
import { buildCertificatePayload } from "@/lib/blockchain";
import {
  certificateIssuedEmail,
  courseCompletionCongratsEmail,
  getEmailBranding,
} from "@/lib/email-templates";
import { getServerBaseUrl } from "@/lib/base-url";
import { verificationPortalUrl } from "@/lib/verification-portal-url";

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
    // Never overwrite an existing certificate: recipientName is part of the on-chain hash.
    update: {},
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

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
    to: [user.email],
    subject: `Congratulations! You completed ${course.title}`,
    html: courseCompletionCongratsEmail(
      {
        studentName: user.name,
        courseName: course.title,
        certificateUrl,
      },
      await getEmailBranding()
    ),
  });

  // Resend reports failures via `error` (it does not throw). Leave
  // completionEmailSentAt unset so a later trigger can retry; don't throw so
  // the caller's lesson-completion flow is unaffected.
  if (error) {
    console.error("Course completion email failed:", error);
    return;
  }

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
      courseName: true,
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

  const courseName = certificate.courseName ?? certificate.Course.title;

  if (!certificate.qrData) {
    const { qrData } = await buildCertificatePayload({
      uniqueId: certificate.uniqueId,
      studentName: certificate.recipientName ?? certificate.User.name ?? "",
      courseName,
      issuedAt: certificate.issuedAt,
    });

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { qrData },
    });
  }

  if (certificate.issuedEmailSentAt) return;

  const verificationUrl = verificationPortalUrl();
  const explorerBase = process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? "https://amoy.polygonscan.com";
  const txUrl = certificate.txHash ? `${explorerBase}/tx/${certificate.txHash}` : null;

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
    to: [certificate.User.email],
    subject: `Certificate issued: ${courseName}`,
    html: certificateIssuedEmail(
      {
        studentName: certificate.recipientName ?? certificate.User.name,
        courseName,
        certificateId: certificate.uniqueId,
        verificationUrl,
        txUrl,
        network: certificate.network,
      },
      await getEmailBranding()
    ),
  });

  // Resend reports failures via `error` (it does not throw). Leave
  // issuedEmailSentAt unset so it can be retried. Don't throw: the caller
  // (issueCertificate) would otherwise mark an on-chain-issued cert FAILED.
  if (error) {
    console.error("Certificate issued email failed:", error);
    return;
  }

  await prisma.certificate.update({
    where: { id: certificate.id },
    data: { issuedEmailSentAt: new Date() },
  });
}

