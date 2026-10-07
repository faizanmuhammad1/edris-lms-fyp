"use server";

import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
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

const postSchema = z.object({
    title: z.string().trim().min(3).max(100),
    content: z.string().trim().min(10).max(10000),
});

const commentSchema = z.object({
    text: z.string().trim().min(1, "Comment cannot be empty").max(1000),
});

// ─── Result helpers ───────────────────────────────────────────────────────────
// Server actions must return plain serializable objects: in production React's
// Flight serializer replaces Error instances with a generic message.

export type ActionResult<T = null> =
    | { success: true; data: T; message?: string; error?: undefined }
    | { success: false; error: string; data?: undefined };

/** An error whose message is safe to show to the user. */
class ActionError extends Error { }

async function runAction<T>(fallbackMessage: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
    try {
        return { success: true, data: await fn() };
    } catch (error) {
        if (error instanceof ActionError) {
            return { success: false, error: error.message };
        }
        console.error(fallbackMessage, error);
        return { success: false, error: fallbackMessage };
    }
}

function firstIssue(error: z.ZodError, fallback: string) {
    return error.issues[0]?.message ?? fallback;
}

// ─── Access helpers ───────────────────────────────────────────────────────────

async function getUserRole(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    return user?.role ?? null;
}

/**
 * Resolves what a user may do in a community.
 * - Platform-wide communities (courseId null, admin-created) are open to every logged-in user.
 * - Course communities are open to the course owner, admins and students with an Active enrollment.
 * - Banned users lose access unless they are a moderator.
 */
async function getCommunityAccess(by: "id" | "slug", value: string, userId: string) {
    const community = await prisma.community.findUnique({
        where: by === "id" ? { id: value } : { slug: value },
        select: {
            id: true,
            slug: true,
            courseId: true,
            course: { select: { userId: true } },
        },
    });

    if (!community) return null;

    const [role, membership, ban, enrollment] = await Promise.all([
        getUserRole(userId),
        prisma.communityMember.findUnique({
            where: { userId_communityId: { userId, communityId: community.id } },
            select: { role: true },
        }),
        prisma.communityBan.findUnique({
            where: { userId_communityId: { userId, communityId: community.id } },
            select: { id: true },
        }),
        community.courseId
            ? prisma.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId: community.courseId } },
                select: { status: true },
            })
            : Promise.resolve(null),
    ]);

    const isAdmin = role === "admin";
    const isOwner = !!community.course && community.course.userId === userId;
    const isPlatformWide = community.courseId === null;
    const isMember = !!membership;
    const isBanned = !!ban;
    const hasActiveEnrollment = enrollment?.status === "Active";

    // Platform admins, the linked course's owner, or the community's creator (ADMIN member)
    const canModerate = isAdmin || isOwner || membership?.role === "ADMIN";
    // Read posts and comments
    const canView = canModerate || (!isBanned && (isMember || isPlatformWide));
    // Become a member
    const canJoin = canModerate || (!isBanned && (isPlatformWide || hasActiveEnrollment));
    // Create posts and comments
    const canParticipate = canModerate || (!isBanned && isMember);

    return {
        community,
        isAdmin,
        isOwner,
        isMember,
        isBanned,
        canModerate,
        canView,
        canJoin,
        canParticipate,
    };
}

async function requireModerator(communityId: string, userId: string) {
    const access = await getCommunityAccess("id", communityId, userId);
    if (!access) throw new ActionError("Community not found");
    if (!access.canModerate) throw new ActionError("Unauthorized");
    return access;
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

// ─── Community CRUD ───────────────────────────────────────────────────────────

export async function createCommunity(
    values: z.infer<typeof communitySchema>
): Promise<ActionResult<{ id: string; slug: string }>> {
    const sessionUser = await requireUser();

    return runAction("Failed to create community", async () => {
        const parsed = communitySchema.safeParse(values);
        if (!parsed.success) {
            throw new ActionError(firstIssue(parsed.error, "Invalid community details"));
        }
        const input = parsed.data;

        const role = await getUserRole(sessionUser.id);
        if (role !== "admin" && role !== "teacher") {
            throw new ActionError("Unauthorized");
        }

        const slug = slugify(input.name, { lower: true });

        const existing = await prisma.community.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (existing) {
            throw new ActionError("A community with this name already exists");
        }

        // Teachers must link one of their own courses; only admins create platform-wide communities
        if (role === "teacher") {
            if (!input.courseId) {
                throw new ActionError("Please select one of your courses for this community");
            }
            const course = await prisma.course.findUnique({
                where: { id: input.courseId },
                select: { userId: true },
            });
            if (!course || course.userId !== sessionUser.id) {
                throw new ActionError("You can only create communities for your own courses");
            }
        } else if (input.courseId) {
            const course = await prisma.course.findUnique({
                where: { id: input.courseId },
                select: { id: true },
            });
            if (!course) throw new ActionError("Course not found");
        }

        const community = await prisma.community.create({
            data: {
                name: input.name,
                description: input.description,
                slug,
                courseId: input.courseId || null,
                members: {
                    create: {
                        userId: sessionUser.id,
                        role: "ADMIN" // Creator is admin
                    }
                }
            },
            select: { id: true, slug: true },
        });

        revalidatePath("/admin/communities");
        revalidatePath("/dashboard/forum");
        revalidatePath("/teacher/communities");

        return community;
    });
}

const communityUpdateSchema = communitySchema.partial();

export async function updateCommunity(
    slug: string,
    values: z.infer<typeof communityUpdateSchema>
): Promise<ActionResult<{ id: string; slug: string }>> {
    const sessionUser = await requireUser();

    return runAction("Failed to update community", async () => {
        const parsed = communityUpdateSchema.safeParse(values);
        if (!parsed.success) {
            throw new ActionError(firstIssue(parsed.error, "Invalid community details"));
        }

        // 1. Fetch current community to check ownership
        const currentCommunity = await prisma.community.findUnique({
            where: { slug },
            select: {
                id: true,
                courseId: true,
                course: { select: { userId: true } }
            }
        });

        if (!currentCommunity) throw new ActionError("Community not found");

        // 2. Authorization Check: Admin or Course Owner (if linked to a course)
        const isAdmin = (await getUserRole(sessionUser.id)) === "admin";
        const isCourseOwner = currentCommunity.course?.userId === sessionUser.id;

        if (!isAdmin && !isCourseOwner) {
            throw new ActionError("You are not authorized to update this community");
        }

        const community = await prisma.community.update({
            where: { slug },
            data: {
                name: parsed.data.name,
                description: parsed.data.description,
            },
            select: { id: true, slug: true },
        });

        revalidatePath("/admin/communities");
        revalidatePath("/teacher/communities");
        revalidatePath(`/admin/communities/${slug}`);
        revalidatePath(`/teacher/communities/${slug}`);
        revalidatePath("/dashboard/forum");

        return community;
    });
}

export async function deleteCommunity(slug: string): Promise<ActionResult> {
    const sessionUser = await requireUser();

    return runAction("Failed to delete community", async () => {
        // 1. Fetch current community to check ownership
        const currentCommunity = await prisma.community.findUnique({
            where: { slug },
            select: {
                id: true,
                courseId: true,
                course: { select: { userId: true } }
            }
        });

        if (!currentCommunity) throw new ActionError("Community not found");

        // 2. Authorization Check
        const isAdmin = (await getUserRole(sessionUser.id)) === "admin";
        const isCourseOwner = currentCommunity.course?.userId === sessionUser.id;

        if (!isAdmin && !isCourseOwner) {
            throw new ActionError("You are not authorized to delete this community");
        }

        await prisma.community.delete({
            where: { slug },
        });

        revalidatePath("/admin/communities");
        revalidatePath("/teacher/communities");
        revalidatePath("/dashboard/forum");

        return null;
    });
}

// Admins see every community; everyone else only sees communities of courses they own.
export async function getCommunities() {
    const sessionUser = await requireUser();
    const isAdmin = (await getUserRole(sessionUser.id)) === "admin";

    return await prisma.community.findMany({
        where: isAdmin ? undefined : { course: { userId: sessionUser.id } },
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
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });
}

// ─── Membership Actions ───────────────────────────────────────────────────────

export async function joinCommunity(communityId: string): Promise<ActionResult<{ alreadyMember: boolean }>> {
    const user = await requireUser();

    return runAction("Failed to join community", async () => {
        const access = await getCommunityAccess("id", communityId, user.id);

        if (!access) throw new ActionError("Community not found");

        if (access.isMember) {
            return { alreadyMember: true };
        }

        if (access.isBanned && !access.canModerate) {
            throw new ActionError("You are banned from this community");
        }

        if (!access.canJoin) {
            throw new ActionError("You must be enrolled in this course to join its community");
        }

        await prisma.communityMember.upsert({
            where: {
                userId_communityId: {
                    userId: user.id,
                    communityId,
                },
            },
            create: {
                userId: user.id,
                communityId,
            },
            update: {},
        });

        revalidatePath("/dashboard/forum");
        revalidatePath(`/dashboard/forum/${access.community.slug}`);
        return { alreadyMember: false };
    });
}

export async function leaveCommunity(communityId: string): Promise<ActionResult> {
    const user = await requireUser();

    return runAction("Failed to leave community", async () => {
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: { slug: true },
        });

        if (!community) throw new ActionError("Community not found");

        await prisma.communityMember.deleteMany({
            where: {
                userId: user.id,
                communityId,
            },
        });

        revalidatePath("/dashboard/forum");
        revalidatePath(`/dashboard/forum/${community.slug}`);
        return null;
    });
}

// ─── Moderation Actions ───────────────────────────────────────────────────────

export async function getCommunityMembers(communityId: string) {
    const session = await requireUser();

    return runAction("Failed to load members", async () => {
        // Verify authorization (Admin, Course Owner or Community Admin)
        await requireModerator(communityId, session.id);

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
    });
}

export async function banMember(communityId: string, userId: string): Promise<ActionResult> {
    const session = await requireUser();

    return runAction("Failed to ban user", async () => {
        const { community } = await requireModerator(communityId, session.id);

        if (userId === session.id) {
            throw new ActionError("You cannot ban yourself");
        }

        // Prevent banning the owner
        if (community.course?.userId === userId) {
            throw new ActionError("Cannot ban the community owner");
        }

        // Transaction: Remove from members, Add to bans
        await prisma.$transaction([
            prisma.communityMember.deleteMany({
                where: {
                    communityId,
                    userId
                }
            }),
            prisma.communityBan.upsert({
                where: {
                    userId_communityId: { userId, communityId }
                },
                create: {
                    communityId,
                    userId,
                    reason: "Violated community guidelines" // Default reason for now
                },
                update: {}
            })
        ]);

        revalidatePath(`/dashboard/forum`);
        revalidatePath(`/dashboard/forum/${community.slug}`);
        return null;
    });
}

export async function unbanMember(communityId: string, userId: string): Promise<ActionResult> {
    const session = await requireUser();

    return runAction("Failed to unban user", async () => {
        const { community } = await requireModerator(communityId, session.id);

        await prisma.communityBan.deleteMany({
            where: {
                communityId,
                userId
            }
        });

        // Unbanned users are not re-added; they can join again.

        revalidatePath(`/dashboard/forum`);
        revalidatePath(`/dashboard/forum/${community.slug}`);
        return null;
    });
}

export async function removeMember(communityId: string, userId: string): Promise<ActionResult> {
    const session = await requireUser();

    return runAction("Failed to remove user", async () => {
        const { community } = await requireModerator(communityId, session.id);

        if (userId === session.id) {
            throw new ActionError("You cannot remove yourself");
        }

        // Prevent removing the owner
        if (community.course?.userId === userId) {
            throw new ActionError("Cannot remove the community owner");
        }

        // Cascading Cleanup ("remove" deletes the user's content; "ban" keeps it)
        await prisma.$transaction(async (tx) => {
            // 1. Delete the user's comments in this community and comments on their posts,
            //    together with every nested reply (Comment.parent is onDelete: NoAction)
            const rootComments = await tx.comment.findMany({
                where: {
                    Post: { communityId },
                    OR: [{ userId }, { Post: { userId } }],
                },
                select: { id: true },
            });
            const commentIds = await collectCommentTreeIds(tx, rootComments.map((c) => c.id));
            if (commentIds.length > 0) {
                await tx.comment.deleteMany({
                    where: { id: { in: commentIds } }
                });
            }

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

            // 4. Remove any ban as well so the user's slate is clean
            await tx.communityBan.deleteMany({
                where: {
                    userId,
                    communityId
                }
            });
        });

        revalidatePath(`/dashboard/forum`);
        revalidatePath(`/dashboard/forum/${community.slug}`);
        return null;
    });
}

// ─── Community Queries ────────────────────────────────────────────────────────

// Communities visible on the student forum: platform-wide ones, ones for courses with an
// Active enrollment, and ones for courses the user owns. Admins see all.
export async function getStudentCommunities() {
    const sessionUser = await requireUser();
    const userId = sessionUser.id;
    const isAdmin = (await getUserRole(userId)) === "admin";

    const where: Prisma.CommunityWhereInput | undefined = isAdmin
        ? undefined
        : {
            bans: { none: { userId } },
            OR: [
                { courseId: null },
                { course: { userId } },
                { course: { enrollment: { some: { userId, status: "Active" } } } },
            ],
        };

    const communities = await prisma.community.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { posts: true, members: true },
            },
            course: {
                select: { id: true, title: true },
            },
            members: {
                where: { userId },
                select: { id: true },
            }
        },
    });

    // Transform to include isMember boolean for easier frontend consumption
    return communities.map(community => ({
        ...community,
        isMember: community.members.length > 0,
        memberCount: community._count.members,
    }));
}

// Returns null when the community does not exist or the user may neither view nor join it.
export async function getCommunity(slug: string) {
    const user = await requireUser(); // Need user context to check membership

    const access = await getCommunityAccess("slug", slug, user.id);

    if (!access || (!access.canView && !access.canJoin)) return null;

    const community = await prisma.community.findUnique({
        where: { id: access.community.id },
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

    const isMember = access.isMember || access.isOwner;

    return {
        ...community,
        isMember,
        memberCount: community._count.members,
        role: community.members[0]?.role || (access.isOwner ? "ADMIN" : "GUEST"),
        canViewPosts: access.canView,
        canParticipate: access.canParticipate,
        canModerate: access.canModerate,
    };
}

// ─── Post Actions ─────────────────────────────────────────────────────────────

export async function createPost(
    communityId: string,
    values: z.infer<typeof postSchema>
): Promise<ActionResult<{ id: string }>> {
    const user = await requireUser();

    return runAction("Failed to create post", async () => {
        const parsed = postSchema.safeParse(values);
        if (!parsed.success) {
            throw new ActionError(firstIssue(parsed.error, "Invalid post"));
        }

        // Verify membership or authorization
        const access = await getCommunityAccess("id", communityId, user.id);

        if (!access) throw new ActionError("Community not found");

        if (access.isBanned && !access.canModerate) {
            throw new ActionError("You are banned from this community");
        }

        if (!access.canParticipate) {
            throw new ActionError("You must join the community to post.");
        }

        const post = await prisma.post.create({
            data: {
                title: parsed.data.title,
                content: parsed.data.content,
                communityId,
                userId: user.id,
            },
            select: { id: true },
        });

        revalidatePath(`/dashboard/forum`);
        revalidatePath(`/dashboard/forum/${access.community.slug}`);
        return post;
    });
}

// Returns an empty list when the user may not read the community's posts.
export async function getPosts(communityId: string) {
    const user = await requireUser();

    const access = await getCommunityAccess("id", communityId, user.id);
    if (!access?.canView) return [];

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
    postId: string,
    parentId?: string
): Promise<ActionResult<{ id: string }>> {
    const user = await requireUser();

    return runAction("Failed to post comment", async () => {
        const parsed = commentSchema.safeParse(values);
        if (!parsed.success) {
            throw new ActionError(firstIssue(parsed.error, "Invalid comment"));
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, communityId: true },
        });

        if (!post) throw new ActionError("Post not found");

        const access = await getCommunityAccess("id", post.communityId, user.id);

        if (!access) throw new ActionError("Community not found");

        if (access.isBanned && !access.canModerate) {
            throw new ActionError("You are banned from this community");
        }

        if (!access.canParticipate) {
            throw new ActionError("You must join the community to comment.");
        }

        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { postId: true },
            });
            if (!parent || parent.postId !== post.id) {
                throw new ActionError("The comment you are replying to no longer exists");
            }
        }

        const comment = await prisma.comment.create({
            data: {
                text: parsed.data.text,
                userId: user.id,
                postId: post.id,
                parentId: parentId ?? null,
            },
            select: { id: true },
        });

        revalidatePath("/dashboard/forum");

        return comment;
    });
}

// Returns null when the post does not exist or the user may not read its community.
export async function getPost(postId: string) {
    const user = await requireUser();

    const post = await prisma.post.findUnique({
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

    if (!post) return null;

    const access = await getCommunityAccess("id", post.communityId, user.id);
    if (!access?.canView) return null;

    return {
        ...post,
        canParticipate: access.canParticipate,
        canModerate: access.canModerate,
    };
}
