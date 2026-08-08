"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { requireAdmin } from "@/app/data/admin/require-admin";
import type { QuizAttemptDetailData } from "@/components/quiz-attempt-detail/QuizAttemptDetail";

export async function getStudentProgressData() {
    await requireUser();
    // Should check if Admin? For now assuming access control is via layout or middleware.

    const students = await prisma.user.findMany({
        where: {
            quizAttempts: {
                some: {} // Only get students with attempts? Or all students?
            }
        },
        include: {
            quizAttempts: {
                include: {
                    Quiz: {
                        include: {
                            Lesson: {
                                include: {
                                    Chapter: {
                                        include: {
                                            Course: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    startedAt: 'desc' // Most recent first
                }
            }
        }
    });

    // Map to the format expected by the frontend
    return students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        quizAttempts: student.quizAttempts.map(attempt => {
            const course = attempt.Quiz.Lesson.Chapter.Course;
            return {
                id: attempt.id,
                quizTitle: attempt.Quiz.title,
                courseName: course.title,
                score: attempt.score || 0,
                timeSpent: attempt.timeSpent || 0,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
                isCompleted: attempt.isCompleted,
                passed: attempt.score ? attempt.score >= attempt.Quiz.passingScore : false,

                // Cheating stats
                tabSwitchCount: attempt.tabSwitchCount,
                backButtonCount: attempt.backButtonCount,
                windowBlurCount: attempt.windowBlurCount,
                visibilityChangeCount: attempt.visibilityChangeCount,
                copyAttemptCount: attempt.copyAttemptCount,
                pasteAttemptCount: attempt.pasteAttemptCount,
                rightClickCount: attempt.rightClickCount,
                devToolsAttemptCount: attempt.devToolsAttemptCount,
            };
        })
    }));
}

type ViolationLogEntry = { type: string; at: string };

export async function getAdminQuizAttemptDetail(attemptId: string): Promise<QuizAttemptDetailData | null> {
    await requireAdmin();

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
            User: { select: { id: true, name: true, email: true, image: true } },
            Quiz: {
                include: {
                    Lesson: {
                        include: {
                            Chapter: {
                                include: {
                                    Course: { select: { id: true, title: true } },
                                },
                            },
                        },
                    },
                    questions: {
                        include: {
                            options: { orderBy: { position: "asc" } },
                        },
                        orderBy: { position: "asc" },
                    },
                },
            },
            answers: true,
        },
    });

    if (!attempt) return null;

    const course = attempt.Quiz.Lesson.Chapter.Course;
    const lesson = attempt.Quiz.Lesson;
    const violationLog = attempt.violationLog as ViolationLogEntry[] | null | undefined;

    const data: QuizAttemptDetailData = {
        student: {
            name: attempt.User.name,
            email: attempt.User.email,
            image: attempt.User.image,
        },
        course: { title: course.title },
        lesson: { title: lesson.title },
        quiz: {
            title: attempt.Quiz.title,
            passingScore: attempt.Quiz.passingScore,
            questions: attempt.Quiz.questions.map((q) => ({
                id: q.id,
                question: q.question,
                points: q.points,
                position: q.position,
                options: q.options,
            })),
        },
        score: attempt.score ?? 0,
        timeSpent: attempt.timeSpent ?? 0,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        passed: attempt.score != null && attempt.score >= attempt.Quiz.passingScore,
        tabSwitchCount: attempt.tabSwitchCount,
        backButtonCount: attempt.backButtonCount,
        windowBlurCount: attempt.windowBlurCount,
        visibilityChangeCount: attempt.visibilityChangeCount,
        copyAttemptCount: attempt.copyAttemptCount,
        pasteAttemptCount: attempt.pasteAttemptCount,
        rightClickCount: attempt.rightClickCount,
        devToolsAttemptCount: attempt.devToolsAttemptCount,
        violationLog: Array.isArray(violationLog) ? violationLog : [],
        answers: attempt.answers.map((a) => ({
            questionId: a.questionId,
            optionId: a.optionId,
            isCorrect: a.isCorrect,
        })),
    };

    return data;
}
