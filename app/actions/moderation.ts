"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { tryCatch } from "@/hooks/try-catch";
import { revalidatePath } from "next/cache";

export async function removeMemberFromCommunity(communityId: string, memberId: string) {
    const session = await requireTeacher();

    return await tryCatch((async () => {
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
            throw new Error("Community not found");
        }

        if (!community.courseId) {
            throw new Error("This is a public community, members cannot be removed via course unenrollment.");
        }

        // 2. Verify the teacher owns the course
        if (community.course?.userId !== session.user.id) {
            throw new Error("You are not authorized to manage members of this community");
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
            throw new Error("Member not found in the associated course");
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

        return { success: true, message: "Member removed from community (unenrolled from course)" };
    })());
}
