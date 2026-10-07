import "server-only";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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
      status: true,
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

  // Draft/archived courses are visible only to their teacher (preview) and admins.
  if (course.status !== "Published") {
    const session = await auth.api.getSession({ headers: await headers() });
    const viewer = session
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
      : null;
    if (!session || (session.user.id !== course.user.id && viewer?.role !== "admin")) {
      return notFound();
    }
  }

  // Average over all reviews (the reviews list above is limited to the latest 10).
  const ratingAggregate = await prisma.review.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
  });
  const avgRating = ratingAggregate._avg.rating ?? 0;

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
