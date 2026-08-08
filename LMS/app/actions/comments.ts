"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createComment(lessonId: string, text: string, parentId?: string) {
    const session = await requireUser();

    try {
        await prisma.comment.create({
            data: {
                text,
                userId: session.id,
                lessonId,
                parentId,
            },
        });

        revalidatePath(`/dashboard`); // Revalidate generally
        return { status: "success", message: "Comment posted successfully!" };
    } catch (error) {
        console.error("Error creating comment:", error);
        return { status: "error", message: "Failed to post comment." };
    }
}

export async function getLessonComments(lessonId: string) {
    // Fetch top-level comments
    const comments = await prisma.comment.findMany({
        where: {
            lessonId,
            parentId: null,
        },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            replies: {
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
                    createdAt: "asc", // Replies usually ordered oldest first
                },
            },
        },
        orderBy: {
            createdAt: "desc", // Newest comments first
        },
    });

    return comments;
}

export type CommentWithReplies = Awaited<ReturnType<typeof getLessonComments>>[0];
