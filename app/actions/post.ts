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
    const session = await requireUser();

    return await tryCatch(async () => {

        const post = await prisma.post.create({
            data: {
                title: values.title,
                content: values.content,
                communityId: values.communityId,
                userId: session.user.id,
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
    });
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
