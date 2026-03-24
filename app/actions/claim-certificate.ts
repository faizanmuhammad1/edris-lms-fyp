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

  const trimmedName = recipientName.trim();
  if (!trimmedName || trimmedName.length < 2) {
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

    const certificate = await prisma.certificate.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: { recipientName: trimmedName },
      create: {
        userId: user.id,
        courseId: course.id,
        recipientName: trimmedName,
      },
      select: {
        id: true,
        uniqueId: true,
        issuedAt: true,
      },
    });

    await issueCertificate(certificate.id, {
      uniqueId: certificate.uniqueId,
      studentName: trimmedName,
      courseName: course.title,
      issuedAt: certificate.issuedAt,
    });

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
