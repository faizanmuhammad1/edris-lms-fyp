"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { scheduleTranscription } from "@/lib/transcription-queue";

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

    // Check if video key is being added or changed
    const videoKeyChanged = result.data.videoKey && result.data.videoKey !== lesson.videoKey;

    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
        // Reset transcription status if video changed
        ...(videoKeyChanged && { transcriptionStatus: "Pending" }),
      },
    });

    // Schedule transcription if video was added/changed
    if (videoKeyChanged) {
      await scheduleTranscription(lessonId);
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

