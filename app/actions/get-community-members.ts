"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/app/actions/community";

type CourseMember = {
    id: string;
    name: string;
    email: string;
    image: string | null;
};

export async function getCommunityMembers(communityId: string): Promise<ActionResult<CourseMember[]>> {
    const session = await requireTeacher();

    try {
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: { courseId: true, course: { select: { userId: true } } }
        });

        if (!community || !community.courseId) {
            return { success: true, data: [] };
        }

        // Only the course owner or an admin may list the course's students
        if (community.course?.userId !== session.user.id) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { role: true }
            });

            if (user?.role !== "admin") {
                return { success: false, error: "Unauthorized" };
            }
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

        return { success: true, data: enrollments.map(e => e.User) };
    } catch (error) {
        console.error("Error loading community members:", error);
        return { success: false, error: "Failed to load members" };
    }
}
