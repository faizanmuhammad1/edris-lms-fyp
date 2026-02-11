"use server";

import { requireUser } from "@/app/data/user/require-user"; // Assuming this exists for students
import { prisma } from "@/lib/db";
import { tryCatch } from "@/hooks/try-catch";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const postSchema = z.object({
    title: z.string().min(3).max(100),
    content: z.string().min(10),
    communityId: z.string(),
});

export async function createPost(values: z.infer<typeof postSchema>) {
    const user = await requireUser();

    return await tryCatch((async () => {

        const post = await prisma.post.create({
            data: {
                title: values.title,
                content: values.content,
                communityId: values.communityId,
                userId: user.id,
            },
        });

        // Revalidate the community page where posts are listed
        // Note: We might need the community slug for the path, or revalidate layout
        // For now assuming we have the slug or we just revalidate "everything" relevant
        // But we only have ID here.
        // Let's create a helper or just revalidate generic path if possible?
        // Or fetch community to get slug.

        const community = await prisma.community.findUnique({
            where: { id: values.communityId },
            select: { slug: true }
        });

        if (community) {
            revalidatePath(`/dashboard/forum/${community.slug}`);
        }

        return { params: post };
    })());
}

export async function getPosts(communityId: string) {
    return await prisma.post.findMany({
        where: { communityId },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    image: true,
                },
            },
            _count: {
                select: { comments: true },
            },
        },
    });
}

export async function deletePost(postId: string) {
    const user = await requireUser();

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                userId: true,
                communityId: true,
                community: {
                    select: {
                        courseId: true,
                        course: {
                            select: { userId: true }
                        }
                    }
                }
            },
        });

        if (!post) {
            return { status: "error", message: "Post not found" };
        }

        const isAuthor = post.userId === user.id;
        const isTeacher = post.community.course?.userId === user.id;

        if (!isAuthor && !isTeacher) {
            return { status: "error", message: "You are not authorized to delete this post" };
        }

        await prisma.post.delete({
            where: { id: postId },
        });

        const community = await prisma.community.findUnique({
            where: { id: post.communityId },
            select: { slug: true }
        });

        if (community) {
            revalidatePath(`/dashboard/forum/${community.slug}`);
            revalidatePath(`/dashboard/forum`);
        }

        return { status: "success", message: "Post deleted successfully" };
    } catch (error) {
        console.error("Error deleting post:", error);
        return { status: "error", message: "Failed to delete post" };
    }
}
