"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";

export async function getCommunityMembers(communityId: string) {
    const session = await requireTeacher();

    const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { courseId: true }
    });

    if (!community || !community.courseId) {
        return [];
    }

    // Verify ownership (optional here if we just want to list, but strict for management actions)
    const course = await prisma.course.findUnique({
        where: { id: community.courseId },
        select: { userId: true }
    });

    if (course?.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    const enrollments = await prisma.enrollment.findMany({
        where: { courseId: community.courseId },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return enrollments.map(e => e.User);
}
