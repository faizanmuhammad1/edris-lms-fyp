import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherQuizzes() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    const quizzes = await prisma.quiz.findMany({
        where: {
            Lesson: {
                Chapter: {
                    Course: {
                        userId: teacherId,
                    },
                },
            },
        },
        include: {
            Lesson: {
                select: {
                    title: true,
                    id: true,
                    chapterId: true,
                    Chapter: {
                        select: {
                            id: true,
                            courseId: true,
                            Course: {
                                select: {
                                    title: true,
                                    id: true,
                                }
                            }
                        }
                    }
                }
            },
            _count: {
                select: {
                    attempts: true,
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return quizzes;
}
