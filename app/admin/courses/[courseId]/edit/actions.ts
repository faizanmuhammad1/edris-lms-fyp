"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { normalizeCourseName } from "@/lib/course-name";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  courseSchema,
  CourseSchemaType,
  lessonSchema,
} from "@/lib/zodSchemas";
import { stripe } from "@/lib/stripe";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { triggerMuxAssetCreation } from "@/lib/mux-trigger";
import { triggerTranscriptionForLesson } from "@/lib/transcription";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function editCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const user = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: user.user.id,
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

    const result = courseSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // Admins (verified by requireAdmin) may edit any course, including teacher-owned ones
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, slug: true, fileKey: true, stripePriceId: true },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    // Check slug uniqueness before touching Stripe
    if (result.data.slug !== course.slug) {
      const slugTaken = await prisma.course.findFirst({
        where: { slug: result.data.slug, NOT: { id: courseId } },
        select: { id: true },
      });
      if (slugTaken) {
        return {
          status: "error",
          message: "This slug is already used by another course. Please choose a different slug.",
        };
      }
    }

    let stripePriceId = course.stripePriceId;

    // Sync with Stripe (same as the teacher edit action)
    if (result.data.title !== course.title || result.data.price !== course.price) {
      const currentPrice = await stripe.prices.retrieve(course.stripePriceId);
      const productId =
        typeof currentPrice.product === "string" ? currentPrice.product : currentPrice.product.id;

      if (result.data.title !== course.title) {
        await stripe.products.update(productId, {
          name: result.data.title,
        });
      }

      if (result.data.price !== course.price) {
        const newPrice = await stripe.prices.create({
          product: productId,
          // price is whole dollars (Int); Stripe expects integer cents
          unit_amount: Math.round(result.data.price * 100),
          currency: "usd",
        });
        stripePriceId = newPrice.id;
      }
    }

    await prisma.course.update({
      where: {
        id: courseId,
      },
      data: {
        ...result.data,
        normalizedName: normalizeCourseName(result.data.title),
        stripePriceId,
      },
    });

    // The previous cover image is only removed from storage once the save succeeded
    if (course.fileKey && course.fileKey !== result.data.fileKey) {
      const oldFileKey = course.fileKey;
      after(async () => {
        const stillUsed = await prisma.course.count({ where: { fileKey: oldFileKey } });
        if (stillUsed === 0) await deleteFilesFromS3([oldFileKey]);
      });
    }

    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath(`/courses/${course.slug}`);
    if (result.data.slug !== course.slug) {
      revalidatePath(`/courses/${result.data.slug}`);
    }

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (err) {
    const e = err as { code?: string; meta?: { target?: unknown } } | null;
    if (e?.code === "P2002" && JSON.stringify(e.meta?.target ?? "").includes("slug")) {
      return {
        status: "error",
        message: "This slug is already used by another course. Please choose a different slug.",
      };
    }
    return {
      status: "error",
      message: "Failed to update Course",
    };
  }
}

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons provided for reordering.",
      };
    }

    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: {
          id: lesson.id,
          chapterId: chapterId,
        },
        data: {
          position: lesson.position,
        },
      })
    );

    await prisma.$transaction(updates);

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder lessons.",
    };
  }
}

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters provided for reordering.",
      };
    }

    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
          courseId: courseId,
        },
        data: {
          position: chapter.position,
        },
      })
    );

    await prisma.$transaction(updates);

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

export async function createChapter(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = chapterSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.chapter.findFirst({
        where: {
          courseId: result.data.courseId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.chapter.create({
        data: {
          title: result.data.name,
          courseId: result.data.courseId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
}

export async function createLesson(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    const newLesson = await prisma.$transaction(async (tx) => {
      const maxPos = await tx.lesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      return tx.lesson.create({
        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    // Process the video in the background (after() survives the response on serverless)
    const newVideoKey = result.data.videoKey;
    if (newVideoKey) {
      after(async () => {
        await triggerMuxAssetCreation(newLesson.id, newVideoKey).catch((err) =>
          console.error("[Mux] Background trigger failed:", err)
        );
        await triggerTranscriptionForLesson(newLesson.id).catch(() => {});
      });
    }

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Lesson created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create lesson",
    };
  }
}

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not Found",
      };
    }

    const lessons = chapterWithLessons.lessons;

    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);

    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found in the chapter.",
      };
    }

    const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lesson.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.lesson.delete({
        where: {
          id: lessonId,
          chapterId: chapterId,
        },
      }),
    ]);
    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson deleted and positions reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const courseWithChapters = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        chapter: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!courseWithChapters) {
      return {
        status: "error",
        message: "Course not Found",
      };
    }

    const chapters = courseWithChapters.chapter;

    const chapterToDelete = chapters.find((chap) => chap.id === chapterId);

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not found in the Course.",
      };
    }

    const remainingChapters = chapters.filter((chap) => chap.id !== chapterId);

    const updates = remainingChapters.map((chap, index) => {
      return prisma.chapter.update({
        where: { id: chap.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.chapter.delete({
        where: {
          id: chapterId,
        },
      }),
    ]);
    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted and positions reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete chapter",
    };
  }
}
