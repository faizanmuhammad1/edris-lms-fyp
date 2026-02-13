"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { tryCatch } from "@/hooks/try-catch";
import { revalidatePath } from "next/cache";

export async function getTeacherReviews() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    // Get all reviews for courses owned by the teacher
    const reviews = await prisma.review.findMany({
        where: {
            Course: {
                userId: teacherId,
            }
        },
        include: {
            User: {
                select: {
                    name: true,
                    image: true,
                    email: true
                }
            },
            Course: {
                select: {
                    title: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return reviews;
}

export async function deleteReview(reviewId: string) {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    return await tryCatch((async () => {
        // Ensure the review belongs to a course owned by the teacher
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: { Course: { select: { userId: true } } }
        });

        if (!review) {
            throw new Error("Review not found");
        }

        if (review.Course.userId !== teacherId) {
            throw new Error("Unauthorized to delete this review");
        }

        await prisma.review.delete({
            where: { id: reviewId }
        });

        revalidatePath("/teacher/analytics");
        revalidatePath("/teacher/reviews");
        return { success: true };
    })());
}
