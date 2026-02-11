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


export async function deleteComment(commentId: string) {
    const session = await requireUser();

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                userId: true,
                lessonId: true,
                Lesson: {
                    select: {
                        Chapter: {
                            select: {
                                Course: {
                                    select: { userId: true }
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!comment) {
            return { status: "error", message: "Comment not found" };
        }

        const isAuthor = comment.userId === session.id;
        // Check if user is the teacher of the course this lesson belongs to
        // Note: Lesson might be null if comment is not linked to a lesson (though schema says lessonId is optional, usually it is linked for lesson comments)
        // If lessonId is present, we check ownership.
        const isTeacher = comment.Lesson?.Chapter.Course.userId === session.id;

        if (!isAuthor && !isTeacher) {
            return { status: "error", message: "You are not authorized to delete this comment" };
        }

        await prisma.comment.delete({
            where: { id: commentId },
        });

        revalidatePath(`/dashboard`); // Revalidate generally
        return { status: "success", message: "Comment deleted successfully!" };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { status: "error", message: "Failed to delete comment." };
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
