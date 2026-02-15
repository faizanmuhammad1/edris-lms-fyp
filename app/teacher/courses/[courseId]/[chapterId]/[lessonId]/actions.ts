"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { triggerMuxAssetCreation } from "@/lib/mux-trigger";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";

export async function updateTeacherLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    // Verify teacher owns this lesson
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: {
          Course: {
            userId: session.user.id,
          },
        },
      },
      include: { attachments: { select: { id: true } } },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found or you don't have permission to edit it",
      };
    }

    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    if (result.data.lessonType === "Reading") {
      const hasContent =
        (result.data.description && result.data.description.trim().length > 0) ||
        !!result.data.pdfKey ||
        (lesson.attachments && lesson.attachments.length > 0);
      if (!hasContent) {
        return {
          status: "error",
          message: "Reading lessons must have at least one of: description, PDF, or an attachment",
        };
      }
    }

    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
        lessonType: result.data.lessonType ?? undefined,
        pdfKey: result.data.pdfKey ?? null,
        pdfFileName: result.data.pdfFileName ?? null,
      },
    });

    // Trigger Mux asset creation in the background if video is present
    if (result.data.videoKey) {
      triggerMuxAssetCreation(lessonId, result.data.videoKey).catch((err) =>
        console.error("[Mux] Background trigger failed:", err)
      );
    }

    return {
      status: "success",
      message: "Lesson updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update lesson",
    };
  }
}

export async function createLessonAttachment(
  lessonId: string,
  data: { fileKey: string; fileName: string; fileSize: number; mimeType: string }
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireTeacher();
  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      include: {
        attachments: { orderBy: { position: "desc" }, take: 1 },
        Chapter: { select: { courseId: true } },
      },
    });
    if (!lesson) {
      return { status: "error", message: "Lesson not found" };
    }
    const position = (lesson.attachments[0]?.position ?? 0) + 1;
    const attachment = await prisma.lessonAttachment.create({
      data: {
        lessonId,
        fileKey: data.fileKey,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        position,
      },
    });
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/edit`);
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    return { status: "success", message: "Attachment added", data: { id: attachment.id } };
  } catch {
    return { status: "error", message: "Failed to add attachment" };
  }
}

export async function deleteLessonAttachment(attachmentId: string): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    const attachment = await prisma.lessonAttachment.findFirst({
      where: {
        id: attachmentId,
        Lesson: { Chapter: { Course: { userId: session.user.id } } },
      },
      include: { Lesson: { include: { Chapter: { select: { courseId: true } } } } },
    });
    if (!attachment) {
      return { status: "error", message: "Attachment not found" };
    }
    await prisma.lessonAttachment.delete({ where: { id: attachmentId } });
    const courseId = attachment.Lesson.Chapter.courseId;
    const lessonId = attachment.lessonId;
    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath(`/teacher/courses/${courseId}/${attachment.Lesson.chapterId}/${lessonId}`);
    return { status: "success", message: "Attachment removed" };
  } catch {
    return { status: "error", message: "Failed to remove attachment" };
  }
}

