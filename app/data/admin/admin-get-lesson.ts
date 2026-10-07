import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";
import { notFound } from "next/navigation";

/** A lesson plus its chapter/course context for the admin lesson editor. */
export async function adminGetLesson(id: string) {
  await requireAdmin();

  const data = await prisma.lesson.findUnique({
    where: {
      id: id,
    },
    select: {
      title: true,
      videoKey: true,
      thumbnailKey: true,
      description: true,
      id: true,
      position: true,
      transcriptionStatus: true,
      Chapter: {
        select: {
          id: true,
          title: true,
          courseId: true,
          Course: { select: { title: true } },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;
