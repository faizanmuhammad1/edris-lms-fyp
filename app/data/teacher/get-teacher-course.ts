import "server-only";
import { requireTeacher } from "./require-teacher";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getTeacherCourse(id: string) {
  const session = await requireTeacher();

  const data = await prisma.course.findFirst({
    where: {
      id: id,
      userId: session.user.id, // Ensure teacher owns this course
    },
    select: {
      id: true,
      title: true,
      description: true,
      fileKey: true,
      price: true,
      duration: true,
      level: true,
      status: true,
      slug: true,
      smallDescription: true,
      category: true,
      chapter: {
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailKey: true,
              position: true,
              videoKey: true,
              transcriptionStatus: true,
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type TeacherCourseSingularType = Awaited<
  ReturnType<typeof getTeacherCourse>
>;

