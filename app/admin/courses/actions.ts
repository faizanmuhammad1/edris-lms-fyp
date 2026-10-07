"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { deleteMuxAssets } from "@/lib/mux-trigger";
import { requireAdmin } from "@/app/data/admin/require-admin";

export async function deleteCourse(courseId: string) {
    await requireAdmin();
    // Fetch all lesson assets before deleting
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
            fileKey: true,
            chapter: {
                select: {
                    lessons: {
                        select: {
                            videoKey: true,
                            thumbnailKey: true,
                            muxAssetId: true,
                        },
                    },
                },
            },
        },
    });

    const keysToDelete: string[] = [];
    const muxAssetIds: string[] = [];

    if (course) {
        if (course.fileKey) keysToDelete.push(course.fileKey);
        course.chapter.forEach((ch) => {
            ch.lessons.forEach((l) => {
                if (l.videoKey) keysToDelete.push(l.videoKey);
                if (l.thumbnailKey) keysToDelete.push(l.thumbnailKey);
                if (l.muxAssetId) muxAssetIds.push(l.muxAssetId);
            });
        });
    }

    await prisma.course.delete({ where: { id: courseId } });

    // Clean up S3 and Mux
    if (keysToDelete.length > 0) await deleteFilesFromS3(keysToDelete);
    if (muxAssetIds.length > 0) await deleteMuxAssets(muxAssetIds);

    revalidatePath("/admin/courses");
}

export async function archiveCourse(courseId: string) {
    await requireAdmin();
    await prisma.course.update({
        where: { id: courseId },
        data: { status: "Archived" },
    });
    revalidatePath("/admin/courses");
}

export async function publishCourse(courseId: string) {
    await requireAdmin();
    await prisma.course.update({
        where: { id: courseId },
        data: { status: "Published" },
    });
    revalidatePath("/admin/courses");
}

export async function unpublishCourse(courseId: string) {
    await requireAdmin();
    await prisma.course.update({
        where: { id: courseId },
        data: { status: "Draft" },
    });
    revalidatePath("/admin/courses");
}
