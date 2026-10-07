"use server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { revalidatePath } from "next/cache";

export type EnrollmentActionResult = { ok: true } | { ok: false; error: string };

async function getEnrollmentAndVerifyTeacher(enrollmentId: string) {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: {
            id: true,
            courseId: true,
            userId: true,
            status: true,
            Course: { select: { userId: true } },
        },
    });

    if (!enrollment) {
        return { error: "Enrollment not found" as const, enrollment: null };
    }
    if (enrollment.Course.userId !== teacherId) {
        return { error: "You can only manage enrollments in your own courses" as const, enrollment: null };
    }
    return { error: null, enrollment };
}

/** Ban: revoke access only. Sets enrollment status to Cancelled. */
export async function banEnrollment(enrollmentId: string): Promise<EnrollmentActionResult> {
    try {
        const { error, enrollment } = await getEnrollmentAndVerifyTeacher(enrollmentId);
        if (error || !enrollment) return { ok: false, error: error ?? "Enrollment not found" };
        if (enrollment.status === "Cancelled") return { ok: false, error: "Enrollment is already banned" };

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: "Cancelled" },
        });
        revalidatePath("/teacher/students");
        return { ok: true };
    } catch (e) {
        console.error("banEnrollment:", e);
        return { ok: false, error: "Failed to ban enrollment" };
    }
}

/** Unban: restore access. Sets enrollment status back to Active. */
export async function unbanEnrollment(enrollmentId: string): Promise<EnrollmentActionResult> {
    try {
        const { error, enrollment } = await getEnrollmentAndVerifyTeacher(enrollmentId);
        if (error || !enrollment) return { ok: false, error: error ?? "Enrollment not found" };
        if (enrollment.status !== "Cancelled") return { ok: false, error: "Enrollment is not banned" };

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: "Active" },
        });
        revalidatePath("/teacher/students");
        return { ok: true };
    } catch (e) {
        console.error("unbanEnrollment:", e);
        return { ok: false, error: "Failed to unban enrollment" };
    }
}

/** Remove: delete enrollment and all related data for this course (cascade). */
export async function removeEnrollment(enrollmentId: string): Promise<EnrollmentActionResult> {
    try {
        const { error, enrollment } = await getEnrollmentAndVerifyTeacher(enrollmentId);
        if (error || !enrollment) return { ok: false, error: error ?? "Enrollment not found" };

        const courseId = enrollment.courseId;
        const userId = enrollment.userId;

        // Get lesson IDs for this course (Chapter -> Lesson)
        const lessons = await prisma.lesson.findMany({
            where: { Chapter: { courseId } },
            select: { id: true },
        });
        const lessonIds = lessons.map((l) => l.id);

        await prisma.$transaction(async (tx) => {
            // Lesson progress for this user in this course's lessons
            if (lessonIds.length > 0) {
                await tx.lessonProgress.deleteMany({
                    where: { userId, lessonId: { in: lessonIds } },
                });
            }

            // Quizzes for this course's lessons
            const quizzes = await tx.quiz.findMany({
                where: { lessonId: { in: lessonIds } },
                select: { id: true },
            });
            const quizIds = quizzes.map((q) => q.id);
            if (quizIds.length > 0) {
                await tx.quizAttempt.deleteMany({
                    where: { userId, quizId: { in: quizIds } },
                });
            }

            // Assignment submissions: assignments for these lessons
            const assignments = await tx.assignment.findMany({
                where: { lessonId: { in: lessonIds } },
                select: { id: true },
            });
            const assignmentIds = assignments.map((a) => a.id);
            if (assignmentIds.length > 0) {
                await tx.assignmentSubmission.deleteMany({
                    where: { userId, assignmentId: { in: assignmentIds } },
                });
            }

            // Certificate for this user and course
            await tx.certificate.deleteMany({
                where: { userId, courseId },
            });

            // Enrollment
            await tx.enrollment.delete({
                where: { id: enrollmentId },
            });
        });

        revalidatePath("/teacher/students");
        return { ok: true };
    } catch (e) {
        console.error("removeEnrollment:", e);
        return { ok: false, error: "Failed to remove enrollment" };
    }
}
