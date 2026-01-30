"use server";
import { requireTeacher } from "./require-teacher";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getTeacherQuiz(lessonId: string) {
    const session = await requireTeacher();

    // Verify teacher owns the course/lesson
    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            Chapter: {
                Course: {
                    userId: session.user.id,
                },
            },
        },
    });

    if (!lesson) {
        return notFound();
    }

    const quiz = await prisma.quiz.findUnique({
        where: {
            lessonId: lessonId,
        },
        include: {
            questions: {
                orderBy: {
                    position: "asc",
                },
                include: {
                    options: {
                        orderBy: {
                            position: "asc",
                        },
                    },
                },
            },
            Lesson: {
                select: {
                    title: true,
                    id: true,
                    chapterId: true,
                    Chapter: {
                        select: {
                            courseId: true
                        }
                    }
                },
            },
        },
    });

    return quiz;
}

export type TeacherQuizType = Awaited<ReturnType<typeof getTeacherQuiz>>;
