"use server";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import type { QuizAttemptDetailData } from "@/components/quiz-attempt-detail/QuizAttemptDetail";

type ViolationLogEntry = { type: string; at: string };

export interface StudentQuizAttempt {
    id: string;
    quizTitle: string;
    courseName: string;
    /** Percentage 0–100. */
    score: number;
    passingScore: number;
    /** Seconds. */
    timeSpent: number;
    startedAt: Date;
    submittedAt: Date | null;
    isCompleted: boolean;
    passed: boolean;

    // Integrity (anti-cheating) counters
    tabSwitchCount: number;
    backButtonCount: number;
    windowBlurCount: number;
    visibilityChangeCount: number;
    copyAttemptCount: number;
    pasteAttemptCount: number;
    rightClickCount: number;
    devToolsAttemptCount: number;
    /** From the violation log, matching the attempt detail view. */
    screenshotAttemptCount: number;
    printAttemptCount: number;
}

export interface StudentProgressStudent {
    id: string;
    name: string;
    email: string;
    image: string | null;
    quizAttempts: StudentQuizAttempt[];
}

export type StudentProgressResult =
    | { status: "success"; data: StudentProgressStudent[] }
    | { status: "error"; message: string };

export type AttemptDetailResult =
    | { status: "success"; data: QuizAttemptDetailData }
    | { status: "error"; message: string };

function parseViolationLog(value: unknown): ViolationLogEntry[] {
    return Array.isArray(value) ? (value as ViolationLogEntry[]) : [];
}

function countViolations(log: ViolationLogEntry[], type: string) {
    return log.filter((entry) => entry?.type === type).length;
}

/** Students with at least one quiz attempt, each with their attempts (newest first). */
export async function getStudentProgressData(): Promise<StudentProgressResult> {
    try {
        await requireAdmin();

        const students = await prisma.user.findMany({
            where: { quizAttempts: { some: {} } },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                quizAttempts: {
                    orderBy: { startedAt: "desc" },
                    select: {
                        id: true,
                        score: true,
                        timeSpent: true,
                        startedAt: true,
                        submittedAt: true,
                        isCompleted: true,
                        tabSwitchCount: true,
                        backButtonCount: true,
                        windowBlurCount: true,
                        visibilityChangeCount: true,
                        copyAttemptCount: true,
                        pasteAttemptCount: true,
                        rightClickCount: true,
                        devToolsAttemptCount: true,
                        violationLog: true,
                        Quiz: {
                            select: {
                                title: true,
                                passingScore: true,
                                Lesson: {
                                    select: {
                                        Chapter: {
                                            select: { Course: { select: { title: true } } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const data = students.map((student) => ({
            id: student.id,
            name: student.name,
            email: student.email,
            image: student.image,
            quizAttempts: student.quizAttempts.map((attempt) => {
                const log = parseViolationLog(attempt.violationLog);
                return {
                    id: attempt.id,
                    quizTitle: attempt.Quiz.title,
                    courseName: attempt.Quiz.Lesson.Chapter.Course.title,
                    score: attempt.score ?? 0,
                    passingScore: attempt.Quiz.passingScore,
                    timeSpent: attempt.timeSpent ?? 0,
                    startedAt: attempt.startedAt,
                    submittedAt: attempt.submittedAt,
                    isCompleted: attempt.isCompleted,
                    // Same rule as the attempt detail view.
                    passed: attempt.score != null && attempt.score >= attempt.Quiz.passingScore,
                    tabSwitchCount: attempt.tabSwitchCount,
                    backButtonCount: attempt.backButtonCount,
                    windowBlurCount: attempt.windowBlurCount,
                    visibilityChangeCount: attempt.visibilityChangeCount,
                    copyAttemptCount: attempt.copyAttemptCount,
                    pasteAttemptCount: attempt.pasteAttemptCount,
                    rightClickCount: attempt.rightClickCount,
                    devToolsAttemptCount: attempt.devToolsAttemptCount,
                    screenshotAttemptCount: countViolations(log, "printscreen"),
                    printAttemptCount: countViolations(log, "print"),
                };
            }),
        }));

        return { status: "success", data };
    } catch (error) {
        // Let requireAdmin()'s redirect propagate.
        unstable_rethrow(error);
        console.error("Failed to load student progress:", error);
        return { status: "error", message: "Couldn't load student progress. Please try again." };
    }
}

const attemptIdSchema = z.string().min(1).max(100);

export async function getAdminQuizAttemptDetail(attemptId: string): Promise<AttemptDetailResult> {
    try {
        await requireAdmin();

        const parsedId = attemptIdSchema.safeParse(attemptId);
        if (!parsedId.success) {
            return { status: "error", message: "Invalid attempt." };
        }

        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: parsedId.data },
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

        if (!attempt) {
            return { status: "error", message: "This attempt no longer exists. It may have been deleted." };
        }

        const course = attempt.Quiz.Lesson.Chapter.Course;
        const lesson = attempt.Quiz.Lesson;

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
            violationLog: parseViolationLog(attempt.violationLog),
            answers: attempt.answers.map((a) => ({
                questionId: a.questionId,
                optionId: a.optionId,
                isCorrect: a.isCorrect,
            })),
        };

        return { status: "success", data };
    } catch (error) {
        unstable_rethrow(error);
        console.error("Failed to load quiz attempt detail:", error);
        return { status: "error", message: "Couldn't load this attempt. Please try again." };
    }
}
