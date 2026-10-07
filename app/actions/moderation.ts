"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/community";

export async function removeMemberFromCommunity(communityId: string, memberId: string): Promise<ActionResult> {
    const session = await requireTeacher();

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, id: true }
        });

        if (!user) return { success: false, error: "User not found" };

        // 1. Get the community to find the associated course
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: {
                courseId: true,
                course: {
                    select: { userId: true, title: true }
                }
            }
        });

        if (!community) {
            return { success: false, error: "Community not found" };
        }

        if (!community.courseId) {
            return { success: false, error: "This is a public community, members cannot be removed via course unenrollment." };
        }

        // 2. Verify the teacher owns the course OR is admin
        if (community.course?.userId !== user.id && user.role !== "admin") {
            return { success: false, error: "You are not authorized to manage members of this community" };
        }

        // 3. Find the enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: memberId,
                    courseId: community.courseId
                }
            }
        });

        if (!enrollment) {
            return { success: false, error: "Member not found in the associated course" };
        }

        // 4. Delete the enrollment (or mark as Cancelled if you prefer soft delete, but for 'remove' hard delete or cancelled is expected)
        // Using delete for now to "remove" them completely from access.
        // Alternatively, update status to Cancelled.

        await prisma.enrollment.delete({
            where: {
                userId_courseId: {
                    userId: memberId,
                    courseId: community.courseId
                }
            }
        });

        revalidatePath(`/teacher/communities`);
        revalidatePath(`/dashboard/forum`);

        return { success: true, data: null, message: "Member removed from community (unenrolled from course)" };
    } catch (error) {
        console.error("Error removing member from community:", error);
        return { success: false, error: "Failed to remove member" };
    }
}
