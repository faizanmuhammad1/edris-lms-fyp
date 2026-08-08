"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return { status: "error" as const, message: "Unauthorized" };
    }

    const name = formData.get("name") as string;

    if (!name || name.trim().length < 2) {
        return { status: "error" as const, message: "Name must be at least 2 characters" };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() },
        });

        revalidatePath("/");
        return { status: "success" as const, message: "Profile updated successfully" };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { status: "error" as const, message: "Failed to update profile" };
    }
}
