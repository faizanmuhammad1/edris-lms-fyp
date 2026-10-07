"use server";

import { requireUser } from "@/app/data/user/require-user"; // Assuming this exists for students
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
    createPost as createCommunityPost,
    getPosts as getCommunityPosts,
} from "@/app/actions/community";

type CreatePostValues = {
    title: string;
    content: string;
    communityId: string;
};

// Delegates to the community action, which validates input and enforces
// membership / ban checks.
export async function createPost(values: CreatePostValues) {
    return await createCommunityPost(values.communityId, {
        title: values.title,
        content: values.content,
    });
}

// Delegates to the community query, which requires a logged-in user with read access.
export async function getPosts(communityId: string) {
    return await getCommunityPosts(communityId);
}

export async function deletePost(postId: string) {
    const sessionUser = await requireUser();
    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true, id: true }
    });

    if (!user) return { status: "error", message: "User not found" };

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
        const isAdmin = user.role === "admin";

        if (!isAuthor && !isTeacher && !isAdmin) {
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
