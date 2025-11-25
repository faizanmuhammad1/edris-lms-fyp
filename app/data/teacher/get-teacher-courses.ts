import "server-only";

import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherCourses() {
  const session = await requireTeacher();

  const data = await prisma.course.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      duration: true,
      level: true,
      status: true,
      price: true,
      fileKey: true,
      slug: true,
    },
  });

  return data;
}

export type TeacherCourseType = Awaited<ReturnType<typeof getTeacherCourses>>[0];

