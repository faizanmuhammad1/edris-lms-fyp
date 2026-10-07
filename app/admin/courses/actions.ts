"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { deleteMuxAssets } from "@/lib/mux-trigger";
import { requireAdmin } from "@/app/data/admin/require-admin";
import type { ApiResponse } from "@/lib/types";

const courseIdSchema = z.string().min(1);

class CourseActionError extends Error {}

/** Runs an admin course action and turns failures into a message the UI can show. */
async function runCourseAction(successMessage: string, fn: () => Promise<void>): Promise<ApiResponse> {
    try {
        await fn();
        return { status: "success", message: successMessage };
    } catch (error) {
        // Let requireAdmin()'s redirect propagate.
        unstable_rethrow(error);
        if (error instanceof CourseActionError) {
            return { status: "error", message: error.message };
        }
        if (error instanceof z.ZodError) {
            return { status: "error", message: "Invalid request" };
        }
        console.error("Admin course action failed:", error);
        return { status: "error", message: "Action failed. Please try again." };
    }
}

async function setCourseStatus(courseId: string, status: "Draft" | "Published" | "Archived") {
    courseIdSchema.parse(courseId);
    await requireAdmin();
    const result = await prisma.course.updateMany({
        where: { id: courseId },
        data: { status },
    });
    if (result.count === 0) {
        throw new CourseActionError("This course no longer exists.");
    }
    revalidatePath("/admin/courses");
}

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
    return runCourseAction("Course deleted", async () => {
        courseIdSchema.parse(courseId);
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

        if (!course) {
            throw new CourseActionError("This course no longer exists.");
        }

        const keysToDelete: string[] = [];
        const muxAssetIds: string[] = [];

        if (course.fileKey) keysToDelete.push(course.fileKey);
        course.chapter.forEach((ch) => {
            ch.lessons.forEach((l) => {
                if (l.videoKey) keysToDelete.push(l.videoKey);
                if (l.thumbnailKey) keysToDelete.push(l.thumbnailKey);
                if (l.muxAssetId) muxAssetIds.push(l.muxAssetId);
            });
        });

        await prisma.course.delete({ where: { id: courseId } });

        // Clean up S3 and Mux
        if (keysToDelete.length > 0) await deleteFilesFromS3(keysToDelete);
        if (muxAssetIds.length > 0) await deleteMuxAssets(muxAssetIds);

        revalidatePath("/admin/courses");
    });
}

export async function archiveCourse(courseId: string): Promise<ApiResponse> {
    return runCourseAction("Course archived", () => setCourseStatus(courseId, "Archived"));
}

export async function publishCourse(courseId: string): Promise<ApiResponse> {
    return runCourseAction("Course published", () => setCourseStatus(courseId, "Published"));
}

export async function unpublishCourse(courseId: string): Promise<ApiResponse> {
    return runCourseAction("Course unpublished", () => setCourseStatus(courseId, "Draft"));
}
