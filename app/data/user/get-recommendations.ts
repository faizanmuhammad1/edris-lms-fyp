import "server-only";

import { prisma } from "@/lib/db";
import { requireUser } from "./require-user";
import type { Course } from "@prisma/client";

export interface NextLessonRecommendation {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
  position: number;
  reason: string;
}

export interface CourseRecommendation {
  course: Pick<
    Course,
    "id" | "title" | "slug" | "category" | "level" | "smallDescription"
  >;
  reason: string;
}

export async function getNextLessonRecommendations(
  courseSlug: string
): Promise<NextLessonRecommendation[]> {
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: {
      id: true,
      title: true,
      chapter: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              lessonProgress: {
                where: { userId: user.id },
                select: {
                  completed: true,
                  lessonId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return [];
  }

  const recommendations: NextLessonRecommendation[] = [];

  // Primary recommendation: first incomplete lesson in course sequence
  for (const chapter of course.chapter) {
    for (const lesson of chapter.lessons) {
      const completed = lesson.lessonProgress[0]?.completed ?? false;
      if (!completed) {
        recommendations.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          courseId: course.id,
          courseTitle: course.title,
          chapterTitle: chapter.title,
          position: lesson.position,
          reason: "Next incomplete lesson in your current course.",
        });
        return recommendations;
      }
    }
  }

  // Fallback: all lessons completed, suggest reviewing last chapter
  const lastChapter = course.chapter[course.chapter.length - 1];
  if (lastChapter && lastChapter.lessons.length > 0) {
    const lastLesson =
      lastChapter.lessons[lastChapter.lessons.length - 1];
    recommendations.push({
      lessonId: lastLesson.id,
      lessonTitle: lastLesson.title,
      courseId: course.id,
      courseTitle: course.title,
      chapterTitle: lastChapter.title,
      position: lastLesson.position,
      reason: "All lessons appear completed — consider reviewing the final lesson.",
    });
  }

  return recommendations;
}

export async function getCourseRecommendationsForUser(): Promise<
  CourseRecommendation[]
> {
  const user = await requireUser();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      status: "Active",
    },
    select: {
      courseId: true,
      Course: {
        select: {
          id: true,
          category: true,
          level: true,
        },
      },
    },
  });

  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  const categories = Array.from(
    new Set(enrollments.map((e) => e.Course.category).filter(Boolean))
  );

  if (categories.length === 0) {
    // If user has no active enrollments, just suggest some featured / recent courses
    const recentCourses = await prisma.course.findMany({
      where: {
        status: "Published",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        level: true,
        smallDescription: true,
      },
    });

    return recentCourses.map((course) => ({
      course,
      reason: "Newly published course on the platform.",
    }));
  }

  const recommended = await prisma.course.findMany({
    where: {
      id: {
        notIn: enrolledCourseIds,
      },
      status: "Published",
      category: {
        in: categories,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      level: true,
      smallDescription: true,
    },
  });

  return recommended.map((course) => ({
    course,
    reason: `Similar to courses you've already taken in ${course.category}.`,
  }));
}

