"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/lib/types";

export async function updateStudentProfile(formData: { name: string }): Promise<ApiResponse> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                status: "error",
                message: "Unauthorized",
            };
        }

        const { name } = formData;

        if (!name || name.trim().length === 0) {
            return {
                status: "error",
                message: "Name is required",
            };
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: { name },
        });

        revalidatePath("/dashboard/settings");

        return {
            status: "success",
            message: "Profile updated successfully",
        };
    } catch (error) {
        console.error("Error updating profile:", error);
        return {
            status: "error",
            message: "Failed to update profile",
        };
    }
}
