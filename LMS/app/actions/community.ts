"use server";

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
    const sessionUser = await requireUser();

    return await tryCatch((async () => {
        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { id: true, role: true },
        });
        if (!user || (user.role !== "admin" && user.role !== "teacher")) {
            throw new Error("Unauthorized");
        }

        const slug = slugify(values.name, { lower: true });

        const existing = await prisma.community.findUnique({
            where: { slug },
        });

        if (existing) {
            throw new Error("A community with this name already exists");
        }

        // If teacher and courseId provided, verify they own the course; admin can attach any course or none
        if (user.role === "teacher" && values.courseId) {
            const course = await prisma.course.findUnique({
                where: { id: values.courseId },
            });
            if (!course || course.userId !== user.id) {
                throw new Error("You can only create communities for your own courses");
            }
        }

        const community = await prisma.community.create({
            data: {
                name: values.name,
                description: values.description,
                slug,
                courseId: values.courseId || null,
                members: {
                    create: {
                        userId: user.id,
                        role: "ADMIN" // Creator is admin
                    }
                }
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
    const sessionUser = await requireUser();

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
            where: { id: sessionUser.id },
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
    const sessionUser = await requireUser();

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
            where: { id: sessionUser.id },
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
                select: { posts: true, members: true },
            },
            course: {
                select: {
                    id: true,
                    title: true,
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });
}

// ─── Membership Actions ───────────────────────────────────────────────────────

export async function joinCommunity(communityId: string) {
    const user = await requireUser();

    return await tryCatch((async () => {
        // Check if already a member
        const existingMember = await prisma.communityMember.findUnique({
            where: {
                userId_communityId: {
                    userId: user.id,
                    communityId,
                },
            },
        });

        if (existingMember) {
            return { success: true, message: "Already a member" };
        }



        // Check if banned
        const banned = await prisma.communityBan.findUnique({
            where: {
                userId_communityId: {
                    userId: user.id,
                    communityId,
                }
            }
        });

        if (banned) {
            throw new Error("You are banned from this community");
        }

        await prisma.communityMember.create({
            data: {
                userId: user.id,
                communityId,
            },
        });

        revalidatePath("/dashboard/forum");
        revalidatePath(`/dashboard/forum/${communityId}`); // In case we add dynamic routes
        return { success: true, message: "Joined community successfully" };
    })());
}

export async function leaveCommunity(communityId: string) {
    const user = await requireUser();

    return await tryCatch((async () => {
        await prisma.communityMember.delete({
            where: {
                userId_communityId: {
                    userId: user.id,
                    communityId,
                },
            },
        });

        revalidatePath("/dashboard/forum");
        revalidatePath(`/dashboard/forum/${communityId}`);
        return { success: true, message: "Left community successfully" };
    })());
}

// ─── Moderation Actions ───────────────────────────────────────────────────────

export async function getCommunityMembers(communityId: string) {
    const session = await requireUser();

    // Verify authorization (Admin or Course Owner/Teacher)
    const community = await prisma.community.findUnique({
        where: { id: communityId },
        include: { course: true }
    });

    if (!community) throw new Error("Community not found");

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { role: true }
    });

    const isGlobalAdmin = user?.role === "admin";
    const isCourseOwner = community.course?.userId === session.id;

    const memberRecord = await prisma.communityMember.findUnique({
        where: {
            userId_communityId: {
                userId: session.id,
                communityId,
            }
        },
        select: { role: true }
    });
    const isCommunityAdmin = memberRecord?.role === "ADMIN";

    if (!isGlobalAdmin && !isCourseOwner && !isCommunityAdmin) {
        throw new Error("Unauthorized");
    }

    const [members, bans] = await Promise.all([
        prisma.communityMember.findMany({
            where: { communityId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    }
                }
            },
            orderBy: { joinedAt: 'desc' }
        }),
        prisma.communityBan.findMany({
            where: { communityId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    return { members, bans };
}

import { Result } from "@/hooks/try-catch";

export async function banMember(communityId: string, userId: string): Promise<Result<{ success: boolean }, Error>> {
    const session = await requireUser();

    return await tryCatch((async () => {
        // Verify authorization
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            include: { course: true }
        });

        if (!community) throw new Error("Community not found");

        const currentUser = await prisma.user.findUnique({
            where: { id: session.id },
            select: { role: true }
        });

        const isGlobalAdmin = currentUser?.role === "admin";
        const isCourseOwner = community.course?.userId === session.id;

        const memberRecord = await prisma.communityMember.findUnique({
            where: {
                userId_communityId: {
                    userId: session.id,
                    communityId,
                }
            },
            select: { role: true }
        });
        const isCommunityAdmin = memberRecord?.role === "ADMIN";

        if (!isGlobalAdmin && !isCourseOwner && !isCommunityAdmin) {
            throw new Error("Unauthorized");
        }

        // Prevent banning the owner
        if (community.course?.userId === userId) {
            throw new Error("Cannot ban the community owner");
        }

        // Transaction: Remove from members, Add to bans
        await prisma.$transaction([
            prisma.communityMember.deleteMany({
                where: {
                    communityId,
                    userId
                }
            }),
            prisma.communityBan.create({
                data: {
                    communityId,
                    userId,
                    reason: "Violated community guidelines" // Default reason for now
                }
            })
        ]);

        revalidatePath(`/dashboard/forum`);
        revalidatePath(`/dashboard/forum/${community.slug}`);
        return { success: true };
    })());
}

export async function unbanMember(communityId: string, userId: string): Promise<Result<{ success: boolean }, Error>> {
    const session = await requireUser();

    return await tryCatch((async () => {
        // Verify authorization
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            include: { course: true }
        });

        if (!community) throw new Error("Community not found");

        const currentUser = await prisma.user.findUnique({
            where: { id: session.id },
            select: { role: true }
        });

        const isGlobalAdmin = currentUser?.role === "admin";
        const isCourseOwner = community.course?.userId === session.id;

        const memberRecord = await prisma.communityMember.findUnique({
            where: {
                userId_communityId: {
                    userId: session.id,
                    communityId,
                }
            },
            select: { role: true }
        });
        const isCommunityAdmin = memberRecord?.role === "ADMIN";

        if (!isGlobalAdmin && !isCourseOwner && !isCommunityAdmin) {
            throw new Error("Unauthorized");
        }

        await prisma.communityBan.deleteMany({
            where: {
                communityId,
                userId
            }
        });

        // Optionally add them back? No, let them join again.

        revalidatePath(`/dashboard/forum`);
        revalidatePath(`/dashboard/forum/${community.slug}`);
        return { success: true };
    })());
}

// Get communities for students - only those for courses they're enrolled in OR public ones if enabled
export async function getStudentCommunities() {
    const sessionUser = await requireUser();

    // Fetch user with role
    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, role: true }
    });

    if (!user) return [];

    let communities;

    // Admins see ALL communities
    if (user.role === "admin") {
        communities = await prisma.community.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { posts: true, members: true },
                },
                course: {
                    select: { id: true, title: true },
                },
                members: {
                    where: { userId: user.id },
                    select: { id: true }, // Check if admin is also a member (optional logic)
                }
            },
        });
    } else {
        // Regular users logic remains similar for visibility, PLUS membership status check
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

        const allRelevantCourseIds = [...new Set([...enrolledCourseIds, ...authoredCourseIds])];

        communities = await prisma.community.findMany({
            where: {
                courseId: { in: allRelevantCourseIds },
            },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { posts: true, members: true },
                },
                course: {
                    select: { id: true, title: true },
                },
                members: {
                    where: { userId: user.id },
                    select: { id: true },
                }
            },
        });
    }

    // Transform to include isMember boolean for easier frontend consumption
    return communities.map(community => ({
        ...community,
        isMember: community.members.length > 0,
        memberCount: community._count.members,
    }));
}

// ... existing imports

export async function getCommunity(slug: string) {
    const user = await requireUser(); // Need user context to check membership

    // Check if user is banned
    const communityId = (await prisma.community.findUnique({ where: { slug }, select: { id: true } }))?.id;

    if (communityId) {
        const banned = await prisma.communityBan.findUnique({
            where: {
                userId_communityId: {
                    userId: user.id,
                    communityId,
                }
            }
        });

        // If banned, and NOT an admin/owner, deny access
        if (banned) {
            const userData = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
            if (userData?.role !== 'admin') {
                // You might want to return a specific error or separate state, 
                // but for now, we can throw or return specific "banned" object.
                // Throwing unauthorized is simplest for security.
                throw new Error("You are banned from this community");
            }
        }
    }

    const community = await prisma.community.findUnique({
        where: { slug },
        include: {
            _count: {
                select: { posts: true, members: true },
            },
            course: {
                select: {
                    userId: true,
                    title: true,
                    _count: {
                        select: { enrollment: true }
                    }
                }
            },
            members: {
                where: { userId: user.id },
                select: { id: true, role: true }
            }
        },
    });

    if (!community) return null;

    const isCreator = !!community.course && community.course.userId === user.id;
    const isMember = community.members.length > 0 || isCreator;

    return {
        ...community,
        isMember,
        memberCount: community._count.members,
        role: community.members[0]?.role || (isCreator ? "ADMIN" : "GUEST"),
    };
}


// Post Actions ... (keep existing)

export async function removeMember(communityId: string, userId: string): Promise<Result<{ success: boolean }, Error>> {
    const session = await requireUser();

    return await tryCatch((async () => {
        // Verify authorization
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            include: { course: true }
        });

        if (!community) throw new Error("Community not found");

        const currentUser = await prisma.user.findUnique({
            where: { id: session.id },
            select: { role: true }
        });

        const isGlobalAdmin = currentUser?.role === "admin";
        const isCourseOwner = community.course?.userId === session.id;

        const memberRecord = await prisma.communityMember.findUnique({
            where: {
                userId_communityId: {
                    userId: session.id,
                    communityId,
                }
            },
            select: { role: true }
        });
        const isCommunityAdmin = memberRecord?.role === "ADMIN";

        if (!isGlobalAdmin && !isCourseOwner && !isCommunityAdmin) {
            throw new Error("Unauthorized");
        }

        // Prevent removing the owner
        if (community.course?.userId === userId) {
            throw new Error("Cannot remove the community owner");
        }

        // Cascading Cleanup
        await prisma.$transaction(async (tx) => {
            // 1. Delete Comments by this user in this community
            // We find comments where the POST belongs to this community
            await tx.comment.deleteMany({
                where: {
                    userId,
                    Post: {
                        communityId
                    }
                }
            });

            // 2. Delete Posts by this user in this community
            await tx.post.deleteMany({
                where: {
                    userId,
                    communityId
                }
            });

            // 3. Remove from CommunityMember
            await tx.communityMember.deleteMany({
                where: {
                    userId,
                    communityId
                }
            });

            // 4. Remove from CommunityBan (if they were banned, just to be clean, though usually remove implies unban logic or separate? 
            // Requirement says "remove" - enforcing "cleanup". If they were banned, we might want to keep the ban? 
            // "Remove" usually means "kick". If they are banned, they are already "removed".
            // But if we are doing a "Hard Delete" of a student, we likely want to wipe their slate.
            // Let's remove the ban too to ensure clean state, or keep it?
            // "remove or ban student... banning should restrict access but keep stats... deleting should cascading db cleanup"
            // So "deleting" (removing) should clean up.
            await tx.communityBan.deleteMany({
                where: {
                    userId,
                    communityId
                }
            });
        });

        revalidatePath(`/dashboard/forum`);
        revalidatePath(`/dashboard/forum/${community.slug}`);
        return { success: true };
    })());
}

export async function createPost(communityId: string, values: z.infer<typeof postSchema>) {
    // ... rest of createPost

    const user = await requireUser();

    return await tryCatch((async () => {
        // Verify membership or authorization
        const userRecord = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        });

        const community = await prisma.community.findUnique({
            where: { id: communityId },
            include: { course: { select: { userId: true } } }
        });

        if (!community) throw new Error("Community not found");

        const isAdmin = userRecord?.role === "admin";
        const isOwner = community.course?.userId === user.id;

        if (!isAdmin && !isOwner) {
            const membership = await prisma.communityMember.findUnique({
                where: { userId_communityId: { userId: user.id, communityId } }
            });
            if (!membership) throw new Error("You must join the community to post.");
        }

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
