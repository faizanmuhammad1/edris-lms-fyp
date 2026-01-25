"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireTeacher() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("You must be logged in to access this page.");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            teacherStatus: true,
            role: true,
        },
    });

    // Admins should be redirected to admin portal
    if (user?.role === "admin") {
        redirect("/admin");
    }

    if (user?.teacherStatus !== "Approved" && user?.role !== "teacher") {
        throw new Error("You must be an approved teacher to access this page.");
    }

    return session;
}

