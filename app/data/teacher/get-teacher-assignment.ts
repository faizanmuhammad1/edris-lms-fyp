import "server-only";
import { requireTeacher } from "./require-teacher";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getTeacherAssignment(lessonId: string) {
  const session = await requireTeacher();

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: { Course: { userId: session.user.id } },
    },
    select: {
      id: true,
      title: true,
      chapterId: true,
      Chapter: { select: { courseId: true } },
      assignment: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxScore: true,
          allowFile: true,
          allowText: true,
          autoGradeEnabled: true,
          maxFileSizeBytes: true,
          maxTextLength: true,
          submissions: {
            orderBy: { submittedAt: "desc" },
            select: {
              id: true,
              userId: true,
              fileKey: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              textAnswer: true,
              submittedAt: true,
              status: true,
              score: true,
              feedback: true,
              teacherFeedback: true,
              gradedAt: true,
              gradingMethod: true,
              gradedByAiAt: true,
              User: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    chapterId: lesson.chapterId,
    courseId: lesson.Chapter.courseId,
    assignment: lesson.assignment,
  };
}

export type TeacherAssignmentType = Awaited<ReturnType<typeof getTeacherAssignment>>;
