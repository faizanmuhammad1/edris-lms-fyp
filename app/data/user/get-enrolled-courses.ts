import { requireUser } from "./require-user";
import { prisma } from "@/lib/db";

export async function getEnrolledCourses() {
  const user = await requireUser();

  const data = await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      status: "Active",
    },
    select: {
      Course: {
        select: {
          id: true,
          smallDescription: true,
          title: true,
          fileKey: true,
          level: true,
          slug: true,
          duration: true,
          chapter: {
            select: {
              id: true,
              lessons: {
                select: {
                  id: true,
                  lessonProgress: {
                    where: {
                      userId: user.id,
                    },
                    select: {
                      id: true,
                      completed: true,
                      lessonId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (data.length === 0) {
    // Build mock enrolled courses with chapters/lessons/progress for demo
    const uid = user.id;
    const mock = [
      {
        Course: {
          id: "course-nextjs",
          smallDescription: "Build modern web apps with Next.js and React.",
          title: "Introduction to Next.js",
          fileKey: "thumbnails/nextjs.png",
          level: "Beginner",
          slug: "introduction-to-nextjs",
          duration: 180,
          chapter: [
            {
              id: "ch-nx-1",
              lessons: [
                {
                  id: "l-nx-1",
                  lessonProgress: [
                    { id: "p-nx-1", completed: true, lessonId: "l-nx-1" },
                  ],
                },
                {
                  id: "l-nx-2",
                  lessonProgress: [
                    { id: "p-nx-2", completed: true, lessonId: "l-nx-2" },
                  ],
                },
                {
                  id: "l-nx-3",
                  lessonProgress: [
                    { id: "p-nx-3", completed: true, lessonId: "l-nx-3" },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        Course: {
          id: "course-react-state",
          smallDescription: "Manage complex state with hooks and patterns.",
          title: "React State Management",
          fileKey: "thumbnails/react.png",
          level: "Intermediate",
          slug: "react-state-management",
          duration: 210,
          chapter: [
            {
              id: "ch-rs-1",
              lessons: [
                {
                  id: "l-rs-1",
                  lessonProgress: [
                    { id: "p-rs-1", completed: true, lessonId: "l-rs-1" },
                  ],
                },
                {
                  id: "l-rs-2",
                  lessonProgress: [
                    { id: "p-rs-2", completed: false, lessonId: "l-rs-2" },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];

    // Attach userId to progress entries for consistency
    mock.forEach((m) =>
      m.Course.chapter.forEach((ch) =>
        ch.lessons.forEach((ls) =>
          ls.lessonProgress.forEach((p) => Object.assign(p, { userId: uid }))
        )
      )
    );

    return mock as typeof data;
  }

  return data;
}

export type EnrolledCourseType = Awaited<
  ReturnType<typeof getEnrolledCourses>
>[0];
