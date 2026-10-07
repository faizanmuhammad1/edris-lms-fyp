"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { triggerMuxAssetCreation } from "@/lib/mux-trigger";
import { triggerTranscriptionForLesson } from "@/lib/transcription";
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
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { deleteMuxAssets } from "@/lib/mux-trigger";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function editTeacherCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const session = await requireTeacher();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "Too many saves in a short time. Please wait a minute and try again.",
        };
      } else {
        return {
          status: "error",
          message: "Your request was blocked. If this is a mistake, please contact support.",
        };
      }
    }

    const result = courseSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Some course details are invalid. Please review the form and try again.",
      };
    }

    // Verify teacher owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found or you don't have permission to edit it",
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

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...result.data };
    updateData.normalizedName = normalizeCourseName(result.data.title);

    // Sync with Stripe
    if (result.data.title !== course.title || result.data.price !== course.price) {
      // 1. Get the price object to find the product ID
      const currentPrice = await stripe.prices.retrieve(course.stripePriceId);
      const productId = typeof currentPrice.product === 'string'
        ? currentPrice.product
        : currentPrice.product.id;

      // 2. Update Product Name if changed
      if (result.data.title !== course.title) {
        await stripe.products.update(productId, {
          name: result.data.title,
        });
      }

      // 3. Create New Price if changed
      if (result.data.price !== course.price) {
        const newPrice = await stripe.prices.create({
          product: productId,
          // price is whole dollars (Int); Stripe expects integer cents
          unit_amount: Math.round(result.data.price * 100),
          currency: 'usd',
        });
        updateData.stripePriceId = newPrice.id;
      }
    }

    await prisma.course.update({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      data: updateData,
    });

    // The previous cover image is only removed from storage once the save succeeded
    if (course.fileKey && course.fileKey !== result.data.fileKey) {
      const oldFileKey = course.fileKey;
      after(async () => {
        const stillUsed = await prisma.course.count({ where: { fileKey: oldFileKey } });
        if (stillUsed === 0) await deleteFilesFromS3([oldFileKey]);
      });
    }

    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath("/teacher/courses");

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (err) {
    if (isUniqueSlugError(err)) {
      return {
        status: "error",
        message: "This slug is already used by another course. Please choose a different slug.",
      };
    }
    console.error("[editTeacherCourse] Error updating course:", err);
    return {
      status: "error",
      message: "We couldn't save the course. Please try again.",
    };
  }
}

function isUniqueSlugError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; meta?: { target?: unknown } };
  return e.code === "P2002" && JSON.stringify(e.meta?.target ?? "").includes("slug");
}

export async function reorderTeacherLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    // Verify teacher owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found or you don't have permission",
      };
    }

    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons provided for reordering.",
      };
    }

    // The chapter must belong to the owned course (chapterId is client-provided)
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, courseId: course.id },
      select: { id: true },
    });

    if (!chapter) {
      return {
        status: "error",
        message: "Chapter not found or you don't have permission",
      };
    }

    // Scope each update to lessons in a chapter of a course this teacher owns
    const updates = lessons.map((lesson) =>
      prisma.lesson.updateMany({
        where: {
          id: lesson.id,
          chapterId: chapter.id,
          Chapter: { courseId: course.id, Course: { userId: session.user.id } },
        },
        data: {
          position: lesson.position,
        },
      })
    );

    await prisma.$transaction(updates);

    revalidatePath(`/teacher/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson order saved",
    };
  } catch (err) {
    console.error("[reorderTeacherLessons] Error reordering lessons:", err);
    return {
      status: "error",
      message: "We couldn't save the new lesson order. Please try again.",
    };
  }
}

export async function reorderTeacherChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    // Verify teacher owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found or you don't have permission",
      };
    }

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

    revalidatePath(`/teacher/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter order saved",
    };
  } catch (err) {
    console.error("[reorderTeacherChapters] Error reordering chapters:", err);
    return {
      status: "error",
      message: "We couldn't save the new chapter order. Please try again.",
    };
  }
}

export async function createTeacherChapter(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    // Verify teacher owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: values.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found or you don't have permission",
      };
    }

    const result = chapterSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Please enter a chapter name of at least 3 characters.",
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

    revalidatePath(`/teacher/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Chapter created",
    };
  } catch (err) {
    console.error("[createTeacherChapter] Error creating chapter:", err);
    return {
      status: "error",
      message: "We couldn't create the chapter. Please try again.",
    };
  }
}

export async function createTeacherLesson(
  values: LessonSchemaType
): Promise<ApiResponse<{ lessonId: string; chapterId: string; courseId: string }>> {
  const session = await requireTeacher();
  try {
    // Verify teacher owns the course through the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: values.chapterId,
      },
      include: {
        Course: true,
      },
    });

    if (!chapter || chapter.Course.userId !== session.user.id) {
      return {
        status: "error",
        message: "Course not found or you don't have permission",
      };
    }

    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Please enter a lesson name of at least 3 characters.",
      };
    }

    if (result.data.lessonType === "Reading") {
      const hasContent =
        (result.data.description && result.data.description.trim().length > 0) ||
        !!result.data.pdfKey;
      if (!hasContent) {
        return {
          status: "error",
          message: "Reading lessons must have at least a description or PDF (you can add attachments after creating the lesson)",
        };
      }
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
          lessonType: result.data.lessonType ?? "Video",
          pdfKey: result.data.pdfKey ?? null,
          pdfFileName: result.data.pdfFileName ?? null,
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    // Trigger Mux asset creation + transcription in the background if video is present.
    // after() keeps the work alive after the response on serverless platforms.
    const newVideoKey = result.data.videoKey;
    if (newVideoKey) {
      after(async () => {
        await triggerMuxAssetCreation(newLesson.id, newVideoKey).catch((err) =>
          console.error("[Mux] Background trigger failed:", err)
        );
        await triggerTranscriptionForLesson(newLesson.id).catch(() => {});
      });
    }

    revalidatePath(`/teacher/courses/${chapter.Course.id}/edit`);

    return {
      status: "success",
      message: "Lesson created",
      data: { lessonId: newLesson.id, chapterId: chapter.id, courseId: chapter.Course.id },
    };
  } catch (err) {
    console.error("[createTeacherLesson] Error creating lesson:", err);
    return {
      status: "error",
      message: "We couldn't create the lesson. Please try again.",
    };
  }
}

export async function deleteTeacherLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    // Verify teacher owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found or you don't have permission",
      };
    }

    const chapterWithLessons = await prisma.chapter.findUnique({
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
            videoKey: true,
            thumbnailKey: true,
            muxAssetId: true,
            pdfKey: true,
            attachments: {
              select: { fileKey: true }
            },
            assignment: {
              select: {
                submissions: {
                  select: { fileKey: true }
                }
              }
            }
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not found. Refresh the page and try again.",
      };
    }

    const lessons = chapterWithLessons.lessons;

    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);

    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found. Refresh the page and try again.",
      };
    }

    // Capture keys for S3 deletion
    const keysToDelete: string[] = [];
    if (lessonToDelete.videoKey) keysToDelete.push(lessonToDelete.videoKey);
    if (lessonToDelete.thumbnailKey) keysToDelete.push(lessonToDelete.thumbnailKey);
    if (lessonToDelete.pdfKey) keysToDelete.push(lessonToDelete.pdfKey);

    lessonToDelete.attachments?.forEach((att) => {
      if (att.fileKey) keysToDelete.push(att.fileKey);
    });

    lessonToDelete.assignment?.submissions?.forEach((sub) => {
      if (sub.fileKey) keysToDelete.push(sub.fileKey);
    });

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

    // Delete files from S3 after successful DB transaction
    if (keysToDelete.length > 0) {
      await deleteFilesFromS3(keysToDelete);
    }

    // Delete Mux assets
    if (lessonToDelete.muxAssetId) {
      await deleteMuxAssets([lessonToDelete.muxAssetId]);
    }
    revalidatePath(`/teacher/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson deleted",
    };
  } catch (err) {
    console.error("[deleteTeacherLesson] Error deleting lesson:", err);
    return {
      status: "error",
      message: "We couldn't delete the lesson. Please try again.",
    };
  }
}

export async function deleteTeacherChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    // Verify teacher owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found or you don't have permission",
      };
    }

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
        message: "Course not found. Refresh the page and try again.",
      };
    }

    const chapters = courseWithChapters.chapter;

    const chapterToDelete = chapters.find((chap) => chap.id === chapterId);

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not found. Refresh the page and try again.",
      };
    }

    // Find all lessons in this chapter to get their keys
    const lessonsInChapter = await prisma.lesson.findMany({
      where: {
        chapterId: chapterId,
      },
      select: {
        videoKey: true,
        thumbnailKey: true,
        muxAssetId: true,
        pdfKey: true,
        attachments: {
          select: { fileKey: true }
        },
        assignment: {
          select: {
            submissions: {
              select: { fileKey: true }
            }
          }
        }
      },
    });

    const keysToDelete: string[] = [];
    lessonsInChapter.forEach((lesson) => {
      if (lesson.videoKey) keysToDelete.push(lesson.videoKey);
      if (lesson.thumbnailKey) keysToDelete.push(lesson.thumbnailKey);
      if (lesson.pdfKey) keysToDelete.push(lesson.pdfKey);

      lesson.attachments?.forEach((att) => {
        if (att.fileKey) keysToDelete.push(att.fileKey);
      });

      lesson.assignment?.submissions?.forEach((sub) => {
        if (sub.fileKey) keysToDelete.push(sub.fileKey);
      });
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

    // Delete files from S3 after successful DB transaction
    if (keysToDelete.length > 0) {
      await deleteFilesFromS3(keysToDelete);
    }

    // Delete Mux assets
    const muxAssetIds = lessonsInChapter
      .map((l) => l.muxAssetId)
      .filter(Boolean) as string[];
    if (muxAssetIds.length > 0) {
      await deleteMuxAssets(muxAssetIds);
    }
    revalidatePath(`/teacher/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted",
    };
  } catch (err) {
    console.error("[deleteTeacherChapter] Error deleting chapter:", err);
    return {
      status: "error",
      message: "We couldn't delete the chapter. Please try again.",
    };
  }
}

