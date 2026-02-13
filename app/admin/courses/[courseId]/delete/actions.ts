"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";

import { prisma } from "@/lib/db";

import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { deleteMuxAssets } from "@/lib/mux-trigger";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been blocked due to rate limiting",
        };
      } else {
        return {
          status: "error",
          message: "You are a bot! if this is a mistake contact our support",
        };
      }
    }
    // 1. Fetch course + lessons to get S3 keys
    const courseWithLessons = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        fileKey: true,
        chapter: {
          select: {
            lessons: {
              select: {
                videoKey: true,
                thumbnailKey: true,
                muxAssetId: true,
              },
            },
          },
        },
      },
    });

    if (!courseWithLessons) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    // 2. Collect all keys
    const keysToDelete: string[] = [];

    // Course image
    if (courseWithLessons.fileKey) {
      keysToDelete.push(courseWithLessons.fileKey);
    }

    // Lesson assets
    const muxAssetIds: string[] = [];
    courseWithLessons.chapter.forEach((chapter) => {
      chapter.lessons.forEach((lesson) => {
        if (lesson.videoKey) keysToDelete.push(lesson.videoKey);
        if (lesson.thumbnailKey) keysToDelete.push(lesson.thumbnailKey);
        if (lesson.muxAssetId) muxAssetIds.push(lesson.muxAssetId);
      });
    });

    // 3. Delete from Utils/DB
    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });

    // 4. Delete from S3
    if (keysToDelete.length > 0) {
      await deleteFilesFromS3(keysToDelete);
    }

    // 5. Delete Mux assets
    if (muxAssetIds.length > 0) {
      await deleteMuxAssets(muxAssetIds);
    }

    revalidatePath("/admin/courses");

    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch {

    return {
      status: "error",
      message: "Failed to delete Course!",
    };
  }
}
