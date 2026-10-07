"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { after } from "next/server";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { deleteMuxAssets } from "@/lib/mux-trigger";
import { z } from "zod";
import { requireAdmin } from "@/app/data/admin/require-admin";

const userIdSchema = z.string().min(1);
const roleSchema = z.enum(["admin", "teacher", "student"]);

export type UserActionResult = { status: "success" | "error"; message: string };

class UserActionError extends Error {}

async function assertNotSelf(targetUserId: string, action: string) {
    const session = await requireAdmin();
    if (session.user.id === targetUserId) {
        throw new UserActionError(`You cannot ${action} your own account.`);
    }
}

/** Runs an admin action and converts failures into a message the UI can show. */
async function runUserAction(
    successMessage: string,
    fn: () => Promise<void>
): Promise<UserActionResult> {
    try {
        await fn();
        return { status: "success", message: successMessage };
    } catch (error) {
        // Let requireAdmin()'s redirect propagate.
        unstable_rethrow(error);
        if (error instanceof UserActionError || error instanceof z.ZodError) {
            return {
                status: "error",
                message: error instanceof z.ZodError ? "Invalid request" : error.message,
            };
        }
        console.error("Admin user action failed:", error);
        return { status: "error", message: "Action failed. Please try again." };
    }
}

export async function banUser(userId: string, reason?: string): Promise<UserActionResult> {
    return runUserAction("User banned", async () => {
        userIdSchema.parse(userId);
        await assertNotSelf(userId, "ban");

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    banned: true,
                    banReason: reason || "Banned by admin",
                },
            }),
            // End active sessions so the ban takes effect immediately.
            prisma.session.deleteMany({ where: { userId } }),
        ]);
        revalidatePath("/admin/users");
        revalidatePath("/admin/teachers");
    });
}

export async function unbanUser(userId: string): Promise<UserActionResult> {
    return runUserAction("User unbanned", async () => {
        userIdSchema.parse(userId);
        await requireAdmin();

        await prisma.user.update({
            where: { id: userId },
            data: {
                banned: false,
                banReason: null,
                banExpires: null,
            },
        });
        revalidatePath("/admin/users");
        revalidatePath("/admin/teachers");
    });
}

/** Storage keys and Mux assets owned by a user's courses and submissions (removed by the cascade). */
async function collectUserMedia(userId: string) {
    const [courses, submissions] = await Promise.all([
        prisma.course.findMany({
            where: { userId },
            select: {
                fileKey: true,
                chapter: {
                    select: {
                        lessons: {
                            select: {
                                videoKey: true,
                                thumbnailKey: true,
                                pdfKey: true,
                                muxAssetId: true,
                                attachments: { select: { fileKey: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma.assignmentSubmission.findMany({
            where: { userId, fileKey: { not: null } },
            select: { fileKey: true },
        }),
    ]);

    const keys = new Set<string>();
    const muxAssetIds = new Set<string>();
    for (const course of courses) {
        if (course.fileKey) keys.add(course.fileKey);
        for (const lesson of course.chapter.flatMap((c) => c.lessons)) {
            for (const key of [lesson.videoKey, lesson.thumbnailKey, lesson.pdfKey]) {
                if (key) keys.add(key);
            }
            lesson.attachments.forEach((a) => keys.add(a.fileKey));
            if (lesson.muxAssetId) muxAssetIds.add(lesson.muxAssetId);
        }
    }
    submissions.forEach((s) => s.fileKey && keys.add(s.fileKey));
    return { keys: [...keys], muxAssetIds: [...muxAssetIds] };
}

/** Deletes files no remaining record references (keys can be shared, e.g. copied lessons). */
async function cleanupOrphanedMedia(keys: string[], muxAssetIds: string[]) {
    const stillUsed = new Set<string>();
    if (keys.length > 0) {
        const [courses, lessons, attachments, submissions] = await Promise.all([
            prisma.course.findMany({ where: { fileKey: { in: keys } }, select: { fileKey: true } }),
            prisma.lesson.findMany({
                where: {
                    OR: [{ videoKey: { in: keys } }, { thumbnailKey: { in: keys } }, { pdfKey: { in: keys } }],
                },
                select: { videoKey: true, thumbnailKey: true, pdfKey: true },
            }),
            prisma.lessonAttachment.findMany({ where: { fileKey: { in: keys } }, select: { fileKey: true } }),
            prisma.assignmentSubmission.findMany({ where: { fileKey: { in: keys } }, select: { fileKey: true } }),
        ]);
        courses.forEach((c) => stillUsed.add(c.fileKey));
        lessons.forEach((l) => [l.videoKey, l.thumbnailKey, l.pdfKey].forEach((k) => k && stillUsed.add(k)));
        attachments.forEach((a) => stillUsed.add(a.fileKey));
        submissions.forEach((s) => s.fileKey && stillUsed.add(s.fileKey));
    }
    const orphanKeys = keys.filter((key) => !stillUsed.has(key));

    const usedAssets = muxAssetIds.length
        ? await prisma.lesson.findMany({ where: { muxAssetId: { in: muxAssetIds } }, select: { muxAssetId: true } })
        : [];
    const usedAssetIds = new Set(usedAssets.map((l) => l.muxAssetId));
    const orphanAssets = muxAssetIds.filter((id) => !usedAssetIds.has(id));

    if (orphanKeys.length > 0) await deleteFilesFromS3(orphanKeys);
    if (orphanAssets.length > 0) await deleteMuxAssets(orphanAssets);
}

export async function deleteUser(userId: string): Promise<UserActionResult> {
    return runUserAction("User deleted", async () => {
        userIdSchema.parse(userId);
        await assertNotSelf(userId, "delete");

        // The cascade removes the user's courses and submissions; collect their files first.
        const media = await collectUserMedia(userId);

        await prisma.user.delete({
            where: { id: userId },
        });

        after(() =>
            cleanupOrphanedMedia(media.keys, media.muxAssetIds).catch((err) =>
                console.error("Failed to clean up deleted user's media:", err)
            )
        );
        revalidatePath("/admin/users");
    });
}

export async function updateUserRole(userId: string, role: string): Promise<UserActionResult> {
    return runUserAction("Role updated", async () => {
        userIdSchema.parse(userId);
        const validRole = roleSchema.parse(role);
        if (validRole !== "admin") {
            await assertNotSelf(userId, "demote");
        } else {
            await requireAdmin();
        }

        const current = await prisma.user.findUnique({
            where: { id: userId },
            select: { teacherStatus: true },
        });
        // Teacher access is granted by teacherStatus "Approved", so keep it in sync with the role.
        const teacherStatus =
            validRole === "teacher"
                ? ("Approved" as const)
                : current?.teacherStatus === "Approved"
                  ? null
                  : current?.teacherStatus;

        await prisma.user.update({
            where: { id: userId },
            data: { role: validRole, teacherStatus },
        });
        revalidatePath("/admin/users");
        revalidatePath("/admin/teachers");
    });
}
