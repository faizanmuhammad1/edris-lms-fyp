"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const commentTextSchema = z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters");

// A user can access a lesson's discussion if they have an Active enrollment in the
// lesson's course, own the course, or are an admin.
async function canAccessLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
            Chapter: {
                select: {
                    courseId: true,
                    Course: { select: { userId: true } },
                },
            },
        },
    });

    if (!lesson) return false;
    if (lesson.Chapter.Course.userId === userId) return true;

    const [user, enrollment] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        }),
        prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: lesson.Chapter.courseId,
                },
            },
            select: { status: true },
        }),
    ]);

    return user?.role === "admin" || enrollment?.status === "Active";
}

/** Returns the given comment ids plus the ids of all their (nested) replies. */
async function collectCommentTreeIds(tx: Prisma.TransactionClient, rootIds: string[]) {
    const all = new Set(rootIds);
    let frontier = rootIds;

    while (frontier.length > 0) {
        const children = await tx.comment.findMany({
            where: { parentId: { in: frontier } },
            select: { id: true },
        });
        frontier = children.map((c) => c.id).filter((id) => !all.has(id));
        frontier.forEach((id) => all.add(id));
    }

    return [...all];
}

export async function createComment(lessonId: string, text: string, parentId?: string) {
    const session = await requireUser();

    const parsed = commentTextSchema.safeParse(text);
    if (!parsed.success) {
        return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid comment." };
    }

    try {
        if (!(await canAccessLesson(session.id, lessonId))) {
            return { status: "error", message: "You must be enrolled in this course to comment." };
        }

        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { lessonId: true },
            });

            if (!parent || parent.lessonId !== lessonId) {
                return { status: "error", message: "The comment you are replying to no longer exists." };
            }
        }

        await prisma.comment.create({
            data: {
                text: parsed.data,
                userId: session.id,
                lessonId,
                parentId: parentId ?? null,
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
                },
                Post: {
                    select: {
                        community: {
                            select: {
                                course: {
                                    select: { userId: true }
                                }
                            }
                        }
                    }
                },
            },
        });

        if (!comment) {
            return { status: "error", message: "Comment not found" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { role: true },
        });

        const isAuthor = comment.userId === session.id;
        // Owner of the course the lesson (or the forum post's community) belongs to
        const courseOwnerId =
            comment.Lesson?.Chapter.Course.userId ?? comment.Post?.community.course?.userId;
        const isCourseOwner = !!courseOwnerId && courseOwnerId === session.id;
        const isAdmin = user?.role === "admin";

        if (!isAuthor && !isCourseOwner && !isAdmin) {
            return { status: "error", message: "You are not authorized to delete this comment" };
        }

        // Comment.parent is onDelete: NoAction, so replies must be removed together with the comment
        await prisma.$transaction(async (tx) => {
            const ids = await collectCommentTreeIds(tx, [commentId]);
            await tx.comment.deleteMany({
                where: { id: { in: ids } },
            });
        });

        revalidatePath(`/dashboard`); // Revalidate generally
        return { status: "success", message: "Comment deleted successfully!" };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { status: "error", message: "Failed to delete comment." };
    }
}

// Returns an empty list when the user may not access the lesson.
export async function getLessonComments(lessonId: string) {
    const session = await requireUser();

    if (!(await canAccessLesson(session.id, lessonId))) {
        return [];
    }

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
