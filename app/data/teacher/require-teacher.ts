"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireTeacher() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("You must be logged in to access this page.");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            teacherStatus: true,
            role: true,
        },
    });

    if (user?.teacherStatus !== "Approved" && user?.role !== "teacher") {
        throw new Error("You must be an approved teacher to access this page.");
    }

    return session;
}
