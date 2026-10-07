"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function isAdmin(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { role: true },
    });
    return user?.role === "admin";
}

export async function approveTeacher(userId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !(await isAdmin(session.user.email))) {
        return { success: false, error: "Unauthorized. Only admins can approve teachers." };
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            teacherStatus: "Approved",
            role: "teacher",
        },
    });
    revalidatePath("/admin/teachers");
    return { success: true, message: "Teacher approved successfully!" };
}

export async function rejectTeacher(userId: string, reason: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !(await isAdmin(session.user.email))) {
        return { success: false, error: "Unauthorized. Only admins can reject teachers." };
    }

    if (!reason || reason.trim().length === 0) {
        return { success: false, error: "Please provide a reason for rejection." };
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            teacherStatus: "Rejected",
            teacherRejectionReason: reason,
        },
    });
    revalidatePath("/admin/teachers");
    return { success: true, message: "Teacher application rejected." };
}

export async function approveTeacherAgain(userId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !(await isAdmin(session.user.email))) {
        return { success: false, error: "Unauthorized. Only admins can approve teachers." };
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            teacherStatus: "Approved",
            role: "teacher",
            teacherRejectionReason: null,
        },
    });
    revalidatePath("/admin/teachers");
    return { success: true, message: "Teacher approved again. Access restored." };
}

