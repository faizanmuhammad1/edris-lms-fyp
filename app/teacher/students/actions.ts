"use server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/app/data/teacher/require-teacher";
import type { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

type OwnedEnrollment = {
    id: string;
    courseId: string;
    userId: string;
    status: string;
    User: { name: string };
    Course: { title: string };
};

type LookupResult = { error: string; enrollment: null } | { error: null; enrollment: OwnedEnrollment };

/** Loads the enrollment and verifies it belongs to one of the signed-in teacher's courses. */
async function getEnrollmentAndVerifyTeacher(teacherId: string, enrollmentId: string): Promise<LookupResult> {
    const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: {
            id: true,
            courseId: true,
            userId: true,
            status: true,
            User: { select: { name: true } },
            Course: { select: { userId: true, title: true } },
        },
    });

    if (!enrollment) {
        return { error: "This enrollment no longer exists. Refresh the page to see the latest list.", enrollment: null };
    }
    if (enrollment.Course.userId !== teacherId) {
        return { error: "You can only manage enrollments in your own courses.", enrollment: null };
    }
    return { error: null, enrollment };
}

function revalidateStudentPages() {
    revalidatePath("/teacher/students");
    revalidatePath("/teacher/student-progress");
}

/** Ban: revoke access only. Sets enrollment status to Cancelled; no data is deleted. */
export async function banEnrollment(enrollmentId: string): Promise<ApiResponse> {
    // Outside the try so auth redirects are not swallowed.
    const session = await requireTeacher();
    try {
        const { error, enrollment } = await getEnrollmentAndVerifyTeacher(session.user.id, enrollmentId);
        if (error !== null) return { status: "error", message: error };
        if (enrollment.status === "Cancelled") {
            return { status: "error", message: `${enrollment.User.name} is already banned from this course.` };
        }

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: "Cancelled" },
        });
        revalidateStudentPages();
        return {
            status: "success",
            message: `${enrollment.User.name} can no longer access ${enrollment.Course.title}.`,
        };
    } catch (e) {
        console.error("banEnrollment:", e);
        return { status: "error", message: "Couldn't ban this student. Please try again." };
    }
}

/** Unban: restore access. Sets enrollment status back to Active. */
export async function unbanEnrollment(enrollmentId: string): Promise<ApiResponse> {
    const session = await requireTeacher();
    try {
        const { error, enrollment } = await getEnrollmentAndVerifyTeacher(session.user.id, enrollmentId);
        if (error !== null) return { status: "error", message: error };
        if (enrollment.status !== "Cancelled") {
            return { status: "error", message: `${enrollment.User.name} already has access to this course.` };
        }

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: "Active" },
        });
        revalidateStudentPages();
        return {
            status: "success",
            message: `${enrollment.User.name} can access ${enrollment.Course.title} again.`,
        };
    } catch (e) {
        console.error("unbanEnrollment:", e);
        return { status: "error", message: "Couldn't restore access. Please try again." };
    }
}

/**
 * Remove: delete the enrollment plus this student's lesson progress, quiz attempts,
 * assignment submissions and certificate for the course.
 */
export async function removeEnrollment(enrollmentId: string): Promise<ApiResponse> {
    const session = await requireTeacher();
    try {
        const { error, enrollment } = await getEnrollmentAndVerifyTeacher(session.user.id, enrollmentId);
        if (error !== null) return { status: "error", message: error };

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

        revalidateStudentPages();
        return {
            status: "success",
            message: `${enrollment.User.name} was removed from ${enrollment.Course.title} and their course data was deleted.`,
        };
    } catch (e) {
        console.error("removeEnrollment:", e);
        return { status: "error", message: "Couldn't remove this enrollment. Please try again." };
    }
}
