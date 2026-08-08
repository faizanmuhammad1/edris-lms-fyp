"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// -----------------------------------------------------------------------------
// QUIZ ACTIONS
// -----------------------------------------------------------------------------

export async function upsertQuiz(
    lessonId: string,
    data: {
        title: string;
        description?: string;
        isPublished?: boolean;
        passingScore?: number;
    }
) {
    const session = await requireTeacher();

    // 1. Verify Ownership
    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            Chapter: { Course: { userId: session.user.id } },
        },
        include: { Chapter: true },
    });

    if (!lesson) throw new Error("Unauthorized or Lesson not found");

    // 2. Upsert Quiz
    const quiz = await prisma.quiz.upsert({
        where: { lessonId },
        create: {
            lessonId,
            title: data.title,
            description: data.description,
            isPublished: data.isPublished ?? false,
            passingScore: data.passingScore ?? 70,
        },
        update: {
            title: data.title,
            description: data.description,
            isPublished: data.isPublished,
            passingScore: data.passingScore,
        },
    });

    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}/quiz`);
    return { success: true, quiz };
}

export async function deleteQuiz(lessonId: string) {
    const session = await requireTeacher();

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            Chapter: { Course: { userId: session.user.id } },
        },
        include: { Chapter: true },
    });

    if (!lesson) throw new Error("Unauthorized or Lesson not found");

    await prisma.quiz.delete({
        where: { lessonId }
    });

    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    return { success: true };
}


// -----------------------------------------------------------------------------
// QUESTION ACTIONS
// -----------------------------------------------------------------------------

export async function createQuestion(
    quizId: string,
    data: {
        question: string;
        points?: number;
        options: { text: string; isCorrect: boolean }[];
    }
) {
    const session = await requireTeacher();

    // 1. Verify Quiz + Ownership
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
    });

    if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Quiz not found");
    }

    // 2. Get Max Position
    const maxPos = await prisma.quizQuestion.findFirst({
        where: { quizId },
        orderBy: { position: "desc" },
        select: { position: true },
    });

    // 3. Create Question with Options
    await prisma.quizQuestion.create({
        data: {
            quizId,
            question: data.question,
            points: data.points ?? 1,
            position: (maxPos?.position ?? 0) + 1,
            options: {
                create: data.options.map((opt, idx) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    position: idx + 1,
                })),
            },
        },
    });

    revalidatePath(`/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`);
    return { success: true };
}

export async function deleteQuestion(questionId: string) {
    const session = await requireTeacher();

    // 1. Verify Ownership
    const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: { Quiz: { include: { Lesson: { include: { Chapter: { include: { Course: true } } } } } } }
    });

    if (!question || question.Quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    // 2. Delete
    await prisma.quizQuestion.delete({ where: { id: questionId } });

    revalidatePath(`/teacher/courses/${question.Quiz.Lesson.Chapter.courseId}/${question.Quiz.Lesson.chapterId}/${question.Quiz.lessonId}/quiz`);
    return { success: true };
}

export async function updateQuestionOrder(quizId: string, items: { id: string; position: number }[]) {
    const session = await requireTeacher();
    // Ownership check omitted for brevity but strictly required in prod.
    // Assuming context is safe for now or relies on previous checks if we wrap.
    // Ideally duplicate ownership check here:
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
    });

    if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Quiz not found");
    }

    const transaction = items.map((item) =>
        prisma.quizQuestion.update({
            where: { id: item.id },
            data: { position: item.position }
        })
    );

    await prisma.$transaction(transaction);
    revalidatePath(`/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`);
    return { success: true };
}
