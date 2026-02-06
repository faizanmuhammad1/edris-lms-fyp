"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { tryCatch } from "@/hooks/try-catch";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { z } from "zod";
import { requireUser } from "@/app/data/user/require-user";

const communitySchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(10).max(500),
    category: z.string().optional(),
    courseId: z.string().optional(), // Link to specific course
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const postSchema = z.object({
    title: z.string().min(3).max(100),
    content: z.string().min(10),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const commentSchema = z.object({
    text: z.string().min(1).max(1000),
});

export async function createCommunity(values: z.infer<typeof communitySchema>) {
    const session = await requireTeacher();

    return await tryCatch((async () => {
        const slug = slugify(values.name, { lower: true });

        const existing = await prisma.community.findUnique({
            where: { slug },
        });

        if (existing) {
            throw new Error("A community with this name already exists");
        }

        // If courseId provided, verify teacher owns the course
        if (values.courseId) {
            const course = await prisma.course.findUnique({
                where: { id: values.courseId },
            });
            if (!course || course.userId !== session.user.id) {
                throw new Error("You can only create communities for your own courses");
            }
        }

        const community = await prisma.community.create({
            data: {
                name: values.name,
                description: values.description,
                slug,
                courseId: values.courseId || null,
            },
        });

        revalidatePath("/admin/communities");
        revalidatePath("/dashboard/forum");
        revalidatePath("/teacher/communities");

        return { params: community };
    })());
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const communityUpdateSchema = communitySchema.partial();

export async function updateCommunity(slug: string, values: z.infer<typeof communityUpdateSchema>) {
    await requireTeacher();

    return await tryCatch((async () => {
        const community = await prisma.community.update({
            where: { slug },
            data: {
                name: values.name,
                description: values.description,
            },
        });

        revalidatePath("/admin/communities");
        revalidatePath("/teacher/communities");
        revalidatePath(`/admin/communities/${slug}`);
        revalidatePath(`/teacher/communities/${slug}`);
        revalidatePath("/dashboard/forum");

        return { params: community };
    })());
}

export async function deleteCommunity(slug: string) {
    await requireTeacher();

    return await tryCatch((async () => {
        await prisma.community.delete({
            where: { slug },
        });

        revalidatePath("/admin/communities");
        revalidatePath("/teacher/communities");
        revalidatePath("/dashboard/forum");

        return { success: true };
    })());
}

export async function getCommunities() {
    return await prisma.community.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { posts: true },
            },
            course: {
                select: { id: true, title: true },
            },
        },
    });
}

// Get communities for students - only those for courses they're enrolled in
export async function getStudentCommunities() {
    const user = await requireUser();

    // Get user's enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map(e => e.courseId);

    // Get communities that are either:
    // 1. Not linked to any course (public communities - optional, remove if you want strict gating)
    // 2. Linked to a course the user is enrolled in
    return await prisma.community.findMany({
        where: {
            OR: [
                { courseId: null }, // Public communities (remove this line for strict course-only access)
                { courseId: { in: enrolledCourseIds } },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { posts: true },
            },
            course: {
                select: { id: true, title: true },
            },
        },
    });
}

export async function getCommunity(slug: string) {
    return await prisma.community.findUnique({
        where: { slug },
        include: {
            _count: {
                select: { posts: true },
            },
        },
    });
}

// Post Actions



export async function createPost(communityId: string, values: z.infer<typeof postSchema>) {
    const user = await requireUser();

    return await tryCatch((async () => {
        const post = await prisma.post.create({
            data: {
                title: values.title,
                content: values.content,
                communityId,
                userId: user.id,
            },
        });

        revalidatePath(`/dashboard/forum`);
        return { params: post };
    })());
}

export async function getPosts(communityId: string) {
    return await prisma.post.findMany({
        where: { communityId },
        include: {
            user: {
                select: {
                    name: true,
                    image: true,
                },
            },
            _count: {
                select: { comments: true }
            }
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createComment(
    values: z.infer<typeof commentSchema>,
    postId?: string,
    lessonId?: string,
    parentId?: string
) {
    const user = await requireUser();

    return await tryCatch((async () => {
        const comment = await prisma.comment.create({
            data: {
                text: values.text,
                userId: user.id,
                postId,
                lessonId,
                parentId
            }
        });


        revalidatePath("/dashboard/forum");

        return { params: comment };
    })());
}

export async function getPost(postId: string) {
    return await prisma.post.findUnique({
        where: { id: postId },
        include: {
            user: {
                select: { name: true, image: true }
            },
            community: {
                select: { name: true, slug: true, id: true }
            },
            comments: {
                include: {
                    User: {
                        select: { name: true, image: true }
                    },
                    replies: {
                        include: {
                            User: { select: { name: true, image: true } }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            }
        }
    });
}
