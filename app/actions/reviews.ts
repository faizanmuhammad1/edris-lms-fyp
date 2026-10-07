"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
    courseId: z.string().min(1),
    rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
    text: z.string().trim().min(1, "Please write a review").max(2000, "Review must be at most 2000 characters"),
});

export async function createReview(courseId: string, rating: number, text: string) {
    const session = await requireUser();

    const parsed = reviewSchema.safeParse({ courseId, rating, text });
    if (!parsed.success) {
        return { status: "error", message: parsed.error.errors[0]?.message ?? "Invalid review" };
    }

    try {
        // Only students with an Active enrollment can review.
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId: session.id, courseId } },
            select: { status: true, Course: { select: { slug: true } } },
        });
        if (enrollment?.status !== "Active") {
            return { status: "error", message: "Only enrolled students can review this course." };
        }

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
                rating: parsed.data.rating,
                text: parsed.data.text,
            },
        });

        revalidatePath(`/dashboard`); // Revalidate generally
        revalidatePath(`/courses/${enrollment.Course.slug}`);
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
