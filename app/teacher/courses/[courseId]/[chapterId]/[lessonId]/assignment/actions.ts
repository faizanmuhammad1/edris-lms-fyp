"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  assignmentSchema,
  gradeSubmissionSchema,
  type AssignmentSchemaType,
  type GradeSubmissionSchemaType,
} from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";

export async function createOrUpdateAssignment(
  lessonId: string,
  values: AssignmentSchemaType
): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        Chapter: { Course: { userId: session.user.id } },
      },
      include: { Chapter: { select: { courseId: true } } },
    });
    if (!lesson) {
      return { status: "error", message: "Lesson not found" };
    }
    const parsed = assignmentSchema.safeParse(values);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.errors[0]?.message ?? "Invalid data" };
    }
    const { title, description, dueDate, maxScore, allowFile, allowText } = parsed.data;
    await prisma.assignment.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title,
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ?? null,
        allowFile,
        allowText,
      },
      update: {
        title,
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ?? null,
        allowFile,
        allowText,
      },
    });
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/edit`);
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}/assignment`);
    return { status: "success", message: "Assignment saved" };
  } catch {
    return { status: "error", message: "Failed to save assignment" };
  }
}

export async function gradeSubmission(
  submissionId: string,
  values: GradeSubmissionSchemaType
): Promise<ApiResponse> {
  const session = await requireTeacher();
  try {
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        Assignment: {
          Lesson: { Chapter: { Course: { userId: session.user.id } } },
        },
      },
      include: {
        Assignment: { Lesson: { Chapter: { select: { courseId: true } } } },
      },
    });
    if (!submission) {
      return { status: "error", message: "Submission not found" };
    }
    const parsed = gradeSubmissionSchema.safeParse(values);
    if (!parsed.success) {
      return { status: "error", message: "Invalid data" };
    }
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: "Graded",
        score: parsed.data.score ?? null,
        feedback: parsed.data.feedback ?? null,
        gradedAt: new Date(),
        gradedById: session.user.id,
      },
    });
    const courseId = submission.Assignment.Lesson.Chapter.courseId;
    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath(`/teacher/courses/${courseId}/${submission.Assignment.Lesson.chapterId}/${submission.Assignment.lessonId}/assignment`);
    return { status: "success", message: "Submission graded" };
  } catch {
    return { status: "error", message: "Failed to grade" };
  }
}
