"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, { message: "Name must be at least 2 characters" })
        .max(100, { message: "Name must be at most 100 characters" }),
});

/** Updates the teacher's display name (the only editable profile field on the User model). */
export async function updateTeacherProfile(values: { name: string }): Promise<ApiResponse> {
    const session = await requireTeacher();

    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
        return { status: "error", message: parsed.error.issues[0]?.message ?? "Please enter a valid display name." };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: parsed.data.name },
        });

        revalidatePath("/teacher/settings");
        revalidatePath("/teacher", "layout");
        return { status: "success", message: "Profile saved" };
    } catch (error) {
        console.error("Error updating teacher profile:", error);
        return { status: "error", message: "We couldn't save your profile. Please try again." };
    }
}
