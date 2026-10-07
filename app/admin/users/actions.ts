"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
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

export async function deleteUser(userId: string): Promise<UserActionResult> {
    return runUserAction("User deleted", async () => {
        userIdSchema.parse(userId);
        await assertNotSelf(userId, "delete");

        await prisma.user.delete({
            where: { id: userId },
        });
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
