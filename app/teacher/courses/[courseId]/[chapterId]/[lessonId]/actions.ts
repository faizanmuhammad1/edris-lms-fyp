"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { triggerMuxAssetCreation } from "@/lib/mux-trigger";
import { ApiResponse } from "@/lib/types";
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

    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
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

