"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function banUser(userId: string, reason?: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            banned: true,
            banReason: reason || "Banned by admin",
        },
    });
    revalidatePath("/admin/users");
}

export async function unbanUser(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            banned: false,
            banReason: null,
        },
    });
    revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
    await prisma.user.delete({
        where: { id: userId },
    });
    revalidatePath("/admin/users");
}

export async function updateUserRole(userId: string, role: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { role },
    });
    revalidatePath("/admin/users");
}
