"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { scheduleTranscription } from "@/lib/transcription-queue";

export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // Get current lesson to check if video changed
    const currentLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { videoKey: true },
    });

    // Check if video key is being added or changed
    const videoKeyChanged = result.data.videoKey && result.data.videoKey !== currentLesson?.videoKey;

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

export async function regenerateSummary(lessonId: string) {
  await requireAdmin();

  try {
    const { generateLessonSummary } = await import("@/lib/generate-summary");
    await generateLessonSummary(lessonId);

    return {
      status: "success",
      message: "Summary generated successfully",
    };
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return {
      status: "error",
      message: "Failed to generate summary",
    };
  }
}
