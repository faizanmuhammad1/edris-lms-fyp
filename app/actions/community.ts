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
    const session = await requireTeacher();

    return await tryCatch((async () => {
        // 1. Fetch current community to check ownership
        const currentCommunity = await prisma.community.findUnique({
            where: { slug },
            select: {
                id: true,
                courseId: true,
                course: { select: { userId: true } }
            }
        });

        if (!currentCommunity) throw new Error("Community not found");

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!user) throw new Error("User not found");

        // 2. Authorization Check
        // Allow if Admin
        const isAdmin = user.role === "admin";
        // Allow if Course Owner (if linked to a course)
        const isCourseOwner = currentCommunity.course?.userId === user.id;

        if (!isAdmin && !isCourseOwner) {
            throw new Error("You are not authorized to update this community");
        }

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
    const session = await requireTeacher();

    return await tryCatch((async () => {
        // 1. Fetch current community to check ownership
        const currentCommunity = await prisma.community.findUnique({
            where: { slug },
            select: {
                id: true,
                courseId: true,
                course: { select: { userId: true } }
            }
        });

        if (!currentCommunity) throw new Error("Community not found");

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!user) throw new Error("User not found");

        // 2. Authorization Check
        const isAdmin = user.role === "admin";
        const isCourseOwner = currentCommunity.course?.userId === user.id;

        if (!isAdmin && !isCourseOwner) {
            throw new Error("You are not authorized to delete this community");
        }

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
    const sessionUser = await requireUser();

    // Fetch user with role
    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, role: true }
    });

    if (!user) return [];

    // Admins see ALL communities
    if (user.role === "admin") {
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

    // Get user's enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map(e => e.courseId);

    // Get courses where user is the teacher/author
    const authoredCourses = await prisma.course.findMany({
        where: { userId: user.id },
        select: { id: true },
    });
    const authoredCourseIds = authoredCourses.map(c => c.id);

    // Combine IDs
    const allRelevantCourseIds = [...new Set([...enrolledCourseIds, ...authoredCourseIds])];

    // Get communities that are either:
    // 1. Not linked to any course (public communities - optional, remove if you want strict gating)
    // 2. Linked to a course the user is enrolled in OR is the teacher of
    return await prisma.community.findMany({
        where: {
            // OR: [
            //    { courseId: null }, // Public communities - DISABLED for now based on user request
            //    { courseId: { in: allRelevantCourseIds } },
            // ],
            courseId: { in: allRelevantCourseIds },
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
            course: {
                select: {
                    userId: true,
                    title: true,
                    _count: {
                        select: { enrollment: true }
                    }
                }
            }
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
