"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import {
  deleteMuxAssets,
  lessonVideoResetData,
  triggerMuxAssetCreation,
} from "@/lib/mux-trigger";
import { triggerTranscriptionForLesson } from "@/lib/transcription";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

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

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        videoKey: true,
        thumbnailKey: true,
        muxAssetId: true,
        chapterId: true,
        Chapter: { select: { courseId: true } },
      },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found",
      };
    }

    // undefined = field not sent (keep current); "" = removed
    const nextVideoKey =
      result.data.videoKey === undefined ? lesson.videoKey : result.data.videoKey || null;
    const nextThumbnailKey =
      result.data.thumbnailKey === undefined
        ? lesson.thumbnailKey
        : result.data.thumbnailKey || null;
    const videoChanged = (lesson.videoKey || null) !== nextVideoKey;

    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: nextThumbnailKey,
        videoKey: nextVideoKey,
        // New/removed video: drop the old Mux playback + transcript
        ...(videoChanged ? lessonVideoResetData() : {}),
      },
    });

    const replacedKeys = [
      videoChanged ? lesson.videoKey : null,
      lesson.thumbnailKey && lesson.thumbnailKey !== nextThumbnailKey ? lesson.thumbnailKey : null,
    ].filter((key): key is string => !!key);
    const oldMuxAssetId = videoChanged ? lesson.muxAssetId : null;
    const shouldProcessVideo = !!nextVideoKey && (videoChanged || !lesson.muxAssetId);

    // Background work must run via after() so it isn't killed once the response is sent
    after(async () => {
      if (oldMuxAssetId) {
        await deleteMuxAssets([oldMuxAssetId]);
      }
      if (replacedKeys.length > 0) {
        await deleteFilesFromS3(replacedKeys);
      }
      if (nextVideoKey) {
        if (shouldProcessVideo) {
          await triggerMuxAssetCreation(lessonId, nextVideoKey).catch((err) =>
            console.error("[Mux] Background trigger failed:", err)
          );
        }
        await triggerTranscriptionForLesson(lessonId).catch(() => {});
      }
    });

    revalidatePath(`/admin/courses/${lesson.Chapter.courseId}/edit`);
    revalidatePath(`/admin/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);

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
