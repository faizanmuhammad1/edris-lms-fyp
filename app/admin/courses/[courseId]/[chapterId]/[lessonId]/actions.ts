"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";

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

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update course",
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
