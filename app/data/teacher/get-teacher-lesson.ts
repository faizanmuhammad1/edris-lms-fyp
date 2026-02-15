import "server-only";
import { requireTeacher } from "./require-teacher";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getTeacherLesson(lessonId: string) {
  const session = await requireTeacher();

  // Get lesson and verify teacher owns the course
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: {
        Course: {
          userId: session.user.id,
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      muxPlaybackId: true,
      muxStatus: true,
      position: true,
      chapterId: true,
      lessonType: true,
      pdfKey: true,
      pdfFileName: true,
      attachments: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          fileKey: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          position: true,
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  return lesson;
}

export type TeacherLessonType = Awaited<ReturnType<typeof getTeacherLesson>>;

