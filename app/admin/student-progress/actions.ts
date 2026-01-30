"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

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
