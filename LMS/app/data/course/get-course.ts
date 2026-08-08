import "server-only";

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getIndividualCourse(slug: string) {
  const course = await prisma.course.findUnique({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      fileKey: true,
      price: true,
      duration: true,
      level: true,
      category: true,
      smallDescription: true,
      createdAt: true,
      updatedAt: true,
      // Instructor info
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          _count: {
            select: {
              courses: true,
            },
          },
        },
      },
      // Reviews for real ratings
      reviews: {
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          User: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      // Enrollment count
      _count: {
        select: {
          enrollment: {
            where: {
              status: "Active",
            },
          },
          reviews: true,
        },
      },
      chapter: {
        select: {
          id: true,
          title: true,
          lessons: {
            select: {
              id: true,
              title: true,
              videoKey: true,
              thumbnailKey: true,
              muxPlaybackId: true,
              muxStatus: true,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course) {
    return notFound();
  }

  // Calculate average rating
  const avgRating =
    course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
      course.reviews.length
      : 0;

  // Use first lesson by position (first chapter, first lesson) for preview.
  // If it has no video, we still show course thumbnail and no play button (no error).
  const firstLesson = course.chapter[0]?.lessons[0] ?? null;
  const previewLesson =
    firstLesson?.videoKey != null ? firstLesson : null;

  let muxStreamUrl: string | null = null;
  let muxThumbnailUrl: string | null = null;

  if (previewLesson?.muxPlaybackId && previewLesson?.muxStatus === "ready") {
    try {
      const { getMuxSignedStreamUrl, getMuxSignedThumbnailUrl } = await import(
        "@/lib/mux"
      );
      muxStreamUrl = getMuxSignedStreamUrl(previewLesson.muxPlaybackId, 1800);
      muxThumbnailUrl = getMuxSignedThumbnailUrl(previewLesson.muxPlaybackId, {
        width: 1920,
      }, 1800);
    } catch (err) {
      console.error("[get-course] Mux signed URL failed:", err);
      // Leave mux URLs null; page will fall back to S3 or no preview
    }
  }

  const previewThumbnailKey =
    previewLesson?.thumbnailKey ?? firstLesson?.thumbnailKey ?? course.fileKey;

  return {
    ...course,
    avgRating: Math.round(avgRating * 10) / 10,
    studentCount: course._count.enrollment,
    reviewCount: course._count.reviews,
    previewVideoKey: previewLesson?.videoKey ?? null,
    previewThumbnailKey,
    muxStreamUrl,
    muxThumbnailUrl,
  };
}

export type IndividualCourseType = Awaited<ReturnType<typeof getIndividualCourse>>;
