"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/lib/types";

const NAME_MIN = 2;
const NAME_MAX = 100;

export async function updateStudentProfile(formData: { name: string }): Promise<ApiResponse> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                status: "error",
                message: "Your session has expired. Please sign in again.",
            };
        }

        const name = typeof formData?.name === "string" ? formData.name.trim().replace(/\s+/g, " ") : "";

        if (name.length < NAME_MIN) {
            return {
                status: "error",
                message: `Name must be at least ${NAME_MIN} characters.`,
            };
        }

        if (name.length > NAME_MAX) {
            return {
                status: "error",
                message: `Name must be ${NAME_MAX} characters or fewer.`,
            };
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: { name },
        });

        revalidatePath("/dashboard", "layout");

        return {
            status: "success",
            message: "Profile updated",
        };
    } catch (error) {
        console.error("Error updating profile:", error);
        return {
            status: "error",
            message: "We couldn't update your profile. Please try again.",
        };
    }
}
