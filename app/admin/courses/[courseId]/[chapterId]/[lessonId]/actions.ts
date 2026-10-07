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
import { unstable_rethrow } from "next/navigation";
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
        message: result.error.issues[0]?.message ?? "Some fields are invalid. Please check the form.",
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
        message: "This lesson no longer exists.",
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
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/edit`);

    return {
      status: "success",
      message: videoChanged && nextVideoKey
        ? "Lesson saved. The new video is being processed."
        : "Lesson saved",
    };
  } catch (err) {
    // Let requireAdmin()'s redirect and other framework errors propagate.
    unstable_rethrow(err);
    console.error("[admin updateLesson] Failed to update lesson:", err);
    return {
      status: "error",
      message: "Couldn't save the lesson. Please try again.",
    };
  }
}
