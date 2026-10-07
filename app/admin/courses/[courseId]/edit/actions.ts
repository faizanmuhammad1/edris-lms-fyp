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
  LessonSchemaType,
} from "@/lib/zodSchemas";
import { stripe } from "@/lib/stripe";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { deleteMuxAssets, triggerMuxAssetCreation } from "@/lib/mux-trigger";
import { triggerTranscriptionForLesson } from "@/lib/transcription";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

const positionsSchema = z
  .array(z.object({ id: z.string().min(1), position: z.number().int().min(1) }))
  .min(1);

/** Storage keys and Mux assets owned by a lesson, removed once the lesson row is deleted. */
const lessonAssetSelect = {
  videoKey: true,
  thumbnailKey: true,
  muxAssetId: true,
  pdfKey: true,
  attachments: { select: { fileKey: true } },
  assignment: { select: { submissions: { select: { fileKey: true } } } },
} as const;

type LessonAssets = {
  videoKey: string | null;
  thumbnailKey: string | null;
  muxAssetId: string | null;
  pdfKey: string | null;
  attachments: { fileKey: string | null }[];
  assignment: { submissions: { fileKey: string | null }[] } | null;
};

/** Deletes lesson files from S3 and Mux after the response is sent (after() survives on serverless). */
function cleanupLessonAssets(lessons: LessonAssets[]) {
  const keys: string[] = [];
  const muxAssetIds: string[] = [];

  for (const lesson of lessons) {
    if (lesson.videoKey) keys.push(lesson.videoKey);
    if (lesson.thumbnailKey) keys.push(lesson.thumbnailKey);
    if (lesson.pdfKey) keys.push(lesson.pdfKey);
    for (const att of lesson.attachments) {
      if (att.fileKey) keys.push(att.fileKey);
    }
    for (const sub of lesson.assignment?.submissions ?? []) {
      if (sub.fileKey) keys.push(sub.fileKey);
    }
    if (lesson.muxAssetId) muxAssetIds.push(lesson.muxAssetId);
  }

  if (keys.length === 0 && muxAssetIds.length === 0) return;

  after(async () => {
    if (keys.length > 0) await deleteFilesFromS3(keys);
    if (muxAssetIds.length > 0) await deleteMuxAssets(muxAssetIds);
  });
}

function revalidateCourseEditor(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/teacher/courses/${courseId}/edit`);
}

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
      return {
        status: "error",
        message: decision.reason.isRateLimit()
          ? "Too many saves in a short time. Please wait a minute and try again."
          : "This request was blocked. If this is a mistake, contact support.",
      };
    }

    const result = courseSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: result.error.issues[0]?.message ?? "Some fields are invalid. Please check the form.",
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
        message: "This course no longer exists.",
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
    revalidateCourseEditor(courseId);
    revalidatePath(`/courses/${course.slug}`);
    if (result.data.slug !== course.slug) {
      revalidatePath(`/courses/${result.data.slug}`);
    }

    return {
      status: "success",
      message: "Course details saved",
    };
  } catch (err) {
    unstable_rethrow(err);
    const e = err as { code?: string; meta?: { target?: unknown } } | null;
    if (e?.code === "P2002" && JSON.stringify(e.meta?.target ?? "").includes("slug")) {
      return {
        status: "error",
        message: "This slug is already used by another course. Please choose a different slug.",
      };
    }
    console.error("[admin editCourse] Failed to update course:", err);
    return {
      status: "error",
      message: "Couldn't save the course. Please try again.",
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
    const parsed = positionsSchema.safeParse(lessons);
    if (!parsed.success) {
      return {
        status: "error",
        message: "No lessons provided for reordering.",
      };
    }

    const updates = parsed.data.map((lesson) =>
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

    revalidateCourseEditor(courseId);

    return {
      status: "success",
      message: "Lesson order saved",
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin reorderLessons] Failed to reorder lessons:", err);
    return {
      status: "error",
      message: "Couldn't save the new lesson order. The previous order was restored.",
    };
  }
}

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const parsed = positionsSchema.safeParse(chapters);
    if (!parsed.success) {
      return {
        status: "error",
        message: "No chapters provided for reordering.",
      };
    }

    const updates = parsed.data.map((chapter) =>
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

    revalidateCourseEditor(courseId);

    return {
      status: "success",
      message: "Chapter order saved",
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin reorderChapters] Failed to reorder chapters:", err);
    return {
      status: "error",
      message: "Couldn't save the new chapter order. The previous order was restored.",
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
        message: result.error.issues[0]?.message ?? "Invalid chapter details.",
      };
    }

    const course = await prisma.course.findUnique({
      where: { id: result.data.courseId },
      select: { id: true },
    });

    if (!course) {
      return {
        status: "error",
        message: "This course no longer exists.",
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

    revalidateCourseEditor(result.data.courseId);

    return {
      status: "success",
      message: `Chapter "${result.data.name}" created`,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin createChapter] Failed to create chapter:", err);
    return {
      status: "error",
      message: "Couldn't create the chapter. Please try again.",
    };
  }
}

export async function createLesson(
  values: LessonSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: result.error.issues[0]?.message ?? "Invalid lesson details.",
      };
    }

    const chapter = await prisma.chapter.findFirst({
      where: { id: result.data.chapterId, courseId: result.data.courseId },
      select: { id: true },
    });

    if (!chapter) {
      return {
        status: "error",
        message: "This chapter no longer exists.",
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

    revalidateCourseEditor(result.data.courseId);

    return {
      status: "success",
      message: `Lesson "${result.data.name}" created`,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin createLesson] Failed to create lesson:", err);
    return {
      status: "error",
      message: "Couldn't create the lesson. Please try again.",
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
    const chapterWithLessons = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        courseId: courseId,
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
            ...lessonAssetSelect,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "This chapter no longer exists.",
      };
    }

    const lessons = chapterWithLessons.lessons;

    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);

    if (!lessonToDelete) {
      return {
        status: "error",
        message: "This lesson no longer exists.",
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

    // Remove the lesson's files only after the database delete succeeded
    cleanupLessonAssets([lessonToDelete]);

    revalidateCourseEditor(courseId);

    return {
      status: "success",
      message: "Lesson deleted",
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin deleteLesson] Failed to delete lesson:", err);
    return {
      status: "error",
      message: "Couldn't delete the lesson. Please try again.",
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
        message: "This course no longer exists.",
      };
    }

    const chapters = courseWithChapters.chapter;

    const chapterToDelete = chapters.find((chap) => chap.id === chapterId);

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "This chapter no longer exists.",
      };
    }

    // Collect the chapter's lesson files before the rows cascade away
    const lessonsInChapter = await prisma.lesson.findMany({
      where: { chapterId },
      select: lessonAssetSelect,
    });

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

    cleanupLessonAssets(lessonsInChapter);

    revalidateCourseEditor(courseId);

    return {
      status: "success",
      message: "Chapter deleted",
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin deleteChapter] Failed to delete chapter:", err);
    return {
      status: "error",
      message: "Couldn't delete the chapter. Please try again.",
    };
  }
}
