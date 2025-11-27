"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function applyAsTeacher() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return { success: false, error: "You must be logged in to apply as a teacher." };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { teacherStatus: true },
    });

    if (user?.teacherStatus === "Approved") {
        return { success: false, error: "You are already an approved teacher." };
    }

    if (user?.teacherStatus === "Pending") {
        return { success: false, error: "Your application is already pending review." };
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            teacherStatus: "Pending",
            teacherApplicationDate: new Date(),
            teacherRejectionReason: null, // Clear any previous rejection reason
        },
    });

    return { success: true, message: "Your application has been submitted successfully!" };
}
