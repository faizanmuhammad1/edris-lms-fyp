"use server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherAssignmentSubmissions(options?: {
  courseId?: string;
}) {
  const session = await requireTeacher();
  const teacherId = session.user.id;

  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      Assignment: {
        Lesson: {
          Chapter: {
            Course: {
              userId: teacherId,
              ...(options?.courseId ? { id: options.courseId } : {}),
            },
          },
        },
      },
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      Assignment: {
        select: {
          id: true,
          title: true,
          maxScore: true,
          lessonId: true,
          Lesson: {
            select: {
              id: true,
              title: true,
              chapterId: true,
              Chapter: {
                select: {
                  id: true,
                  title: true,
                  courseId: true,
                  Course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return submissions.map((sub) => {
    const course = sub.Assignment.Lesson.Chapter.Course;
    const chapter = sub.Assignment.Lesson.Chapter;
    const lesson = sub.Assignment.Lesson;
    return {
      id: sub.id,
      student: {
        id: sub.User.id,
        name: sub.User.name,
        email: sub.User.email,
        image: sub.User.image,
      },
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      lesson: {
        id: lesson.id,
        title: lesson.title,
      },
      chapter: {
        id: chapter.id,
        title: chapter.title,
      },
      assignment: {
        id: sub.Assignment.id,
        title: sub.Assignment.title,
        maxScore: sub.Assignment.maxScore,
      },
      submittedAt: sub.submittedAt,
      status: sub.status,
      score: sub.score,
      feedback: sub.feedback,
      fileKey: sub.fileKey,
      fileName: sub.fileName,
      textAnswer: sub.textAnswer,
      courseId: course.id,
      chapterId: chapter.id,
      lessonId: lesson.id,
    };
  });
}

export type TeacherAssignmentSubmissionItem = Awaited<
  ReturnType<typeof getTeacherAssignmentSubmissions>
>[number];
