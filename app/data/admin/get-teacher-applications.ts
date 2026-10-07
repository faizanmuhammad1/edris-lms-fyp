import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function getTeacherApplications() {
    await requireAdmin();
    const applications = await prisma.user.findMany({
        where: {
            OR: [
                {
                    teacherStatus: {
                        in: ["Pending", "Approved", "Rejected"],
                    },
                },
                {
                    banned: true,
                    OR: [
                        { role: "teacher" },
                        { teacherStatus: { not: null } },
                    ],
                },
            ],
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            teacherStatus: true,
            teacherApplicationDate: true,
            teacherRejectionReason: true,
            banned: true,
            banReason: true,
            banExpires: true,
            createdAt: true,
            _count: {
                select: {
                    courses: true,
                },
            },
        },
        orderBy: [
            { teacherApplicationDate: "desc" },
            { createdAt: "desc" },
        ],
    });

    return applications;
}

export type TeacherApplication = Awaited<ReturnType<typeof getTeacherApplications>>[0];
