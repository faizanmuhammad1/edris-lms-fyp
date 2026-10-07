"use server";

import { requireUser } from "@/app/data/user/require-user";
import { getCourseCompletionStatus } from "@/app/data/course/get-course-completion-status";
import { issueCertificate } from "@/app/actions/issue-certificate";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

function getFriendlyIssueErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("insufficient funds")) {
    return "Certificate issuance is temporarily unavailable due to low blockchain gas funds. Please try again shortly.";
  }

  return "Failed to issue certificate. Please try again.";
}

export async function claimCertificate(
  slug: string,
  recipientName: string
): Promise<ApiResponse<{ certificateId: string }>> {
  const user = await requireUser();

  const trimmedName = typeof recipientName === "string" ? recipientName.trim() : "";
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
    return {
      status: "error",
      message: "Please enter your full name for the certificate.",
    };
  }

  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, title: true },
    });

    if (!course) {
      return { status: "error", message: "Course not found." };
    }

    const completionStatus = await getCourseCompletionStatus(course.id, user.id);
    if (!completionStatus.isEligible) {
      return {
        status: "error",
        message:
          "You must complete all lessons, quizzes, and assignments before claiming your certificate.",
      };
    }

    const existing = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      select: { id: true, blockchainStatus: true },
    });

    // The name and course title are part of the on-chain hash, so they are frozen once issued.
    if (existing?.blockchainStatus === "ISSUED") {
      return {
        status: "success",
        message: "Certificate already issued.",
        data: { certificateId: existing.id },
      };
    }

    const certificate = existing
      ? await prisma.certificate.update({
          where: { id: existing.id },
          data: { recipientName: trimmedName, courseName: course.title },
          select: { id: true },
        })
      : await prisma.certificate.create({
          data: {
            userId: user.id,
            courseId: course.id,
            recipientName: trimmedName,
            courseName: course.title,
          },
          select: { id: true },
        });

    await issueCertificate(certificate.id);

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${slug}`);
    revalidatePath(`/dashboard/certificate/${slug}`);

    return {
      status: "success",
      message: "Certificate issued successfully.",
      data: { certificateId: certificate.id },
    };
  } catch (error) {
    console.error("Failed to claim certificate:", error);
    return {
      status: "error",
      message: getFriendlyIssueErrorMessage(error),
    };
  }
}
