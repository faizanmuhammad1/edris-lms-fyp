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
