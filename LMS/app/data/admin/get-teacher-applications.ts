import { prisma } from "@/lib/db";

export async function getTeacherApplications() {
    const applications = await prisma.user.findMany({
        where: {
            teacherStatus: {
                in: ["Pending", "Approved", "Rejected"],
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            teacherStatus: true,
            teacherApplicationDate: true,
            teacherRejectionReason: true,
            createdAt: true,
            _count: {
                select: {
                    courses: true,
                },
            },
        },
        orderBy: [
            {
                teacherApplicationDate: "desc",
            },
        ],
    });

    return applications;
}

export type TeacherApplication = Awaited<ReturnType<typeof getTeacherApplications>>[0];
