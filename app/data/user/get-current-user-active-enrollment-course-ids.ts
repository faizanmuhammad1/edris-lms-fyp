import "server-only";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function getCurrentUserActiveEnrollmentCourseIds(): Promise<string[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return [];
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
      status: "Active",
    },
    select: {
      courseId: true,
    },
  });

  return enrollments.map((enrollment) => enrollment.courseId);
}
