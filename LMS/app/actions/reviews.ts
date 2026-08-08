"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createReview(courseId: string, rating: number, text: string) {
    const session = await requireUser();

    try {
        const existingReview = await prisma.review.findUnique({
            where: {
                userId_courseId: {
                    userId: session.id,
                    courseId: courseId,
                },
            },
            select: { id: true }
        });

        if (existingReview) {
            return { status: "error", message: "You have already reviewed this course." };
        }

        await prisma.review.create({
            data: {
                userId: session.id,
                courseId: courseId,
                rating: rating,
                text: text,
            },
        });

        revalidatePath(`/dashboard`); // Revalidate generally
        return { status: "success", message: "Review posted successfully!" };
    } catch (error) {
        console.error("Error posting review:", error);
        return { status: "error", message: "Failed to post review." };
    }
}

export async function deleteReview(reviewId: string) {
    const session = await requireUser();

    try {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            select: { userId: true, courseId: true },
        });

        if (!review) {
            return { status: "error", message: "Review not found" };
        }

        if (review.userId !== session.id) {
            return { status: "error", message: "You are not authorized to delete this review" };
        }

        await prisma.review.delete({
            where: { id: reviewId },
        });

        revalidatePath(`/dashboard`); // Revalidate generally
        // Also revalidate the specific course page if needed, normally layout or dashboard covers it
        return { status: "success", message: "Review deleted successfully!" };
    } catch (error) {
        console.error("Error deleting review:", error);
        return { status: "error", message: "Failed to delete review." };
    }
}

export async function getCourseReviews(courseId: string) {
    return await prisma.review.findMany({
        where: {
            courseId: courseId,
        },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
