"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import arcjet, { fixedWindow } from "@/lib/arcjet";

import { prisma } from "@/lib/db";

import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { deleteFilesFromS3 } from "@/lib/s3-helper";
import { deleteMuxAssets } from "@/lib/mux-trigger";

const aj = arcjet.withRule(
    fixedWindow({
        mode: "LIVE",
        window: "1m",
        max: 5,
    })
);

export async function deleteTeacherCourse(courseId: string): Promise<ApiResponse> {
    const session = await requireTeacher();

    try {
        const req = await request();
        const decision = await aj.protect(req, {
            fingerprint: session.user.id,
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return {
                    status: "error",
                    message: "Too many requests. Please wait a minute and try again.",
                };
            } else {
                return {
                    status: "error",
                    message: "Your request was blocked. If this keeps happening, please contact support.",
                };
            }
        }

        // 1. Fetch course + lessons to get S3 keys
        // Verify course belongs to this teacher or is accessible
        const courseWithLessons = await prisma.course.findUnique({
            where: {
                id: courseId,
                userId: session.user.id,
            },
            select: {
                fileKey: true,
                chapter: {
                    select: {
                        lessons: {
                            select: {
                                videoKey: true,
                                thumbnailKey: true,
                                muxAssetId: true,
                                pdfKey: true,
                                attachments: {
                                    select: { fileKey: true }
                                },
                                assignment: {
                                    select: {
                                        submissions: {
                                            select: { fileKey: true }
                                        }
                                    }
                                }
                            },
                        },
                    },
                },
            },
        });

        if (!courseWithLessons) {
            return {
                status: "error",
                message: "Course not found, or you don't have permission to delete it.",
            };
        }

        // 2. Collect all keys
        const keysToDelete: string[] = [];

        // Course image
        if (courseWithLessons.fileKey) {
            keysToDelete.push(courseWithLessons.fileKey);
        }

        // Lesson assets
        const muxAssetIds: string[] = [];
        courseWithLessons.chapter.forEach((chapter) => {
            chapter.lessons.forEach((lesson) => {
                if (lesson.videoKey) keysToDelete.push(lesson.videoKey);
                if (lesson.thumbnailKey) keysToDelete.push(lesson.thumbnailKey);
                if (lesson.pdfKey) keysToDelete.push(lesson.pdfKey);

                lesson.attachments?.forEach((att) => {
                    if (att.fileKey) keysToDelete.push(att.fileKey);
                });

                lesson.assignment?.submissions?.forEach((sub) => {
                    if (sub.fileKey) keysToDelete.push(sub.fileKey);
                });

                if (lesson.muxAssetId) muxAssetIds.push(lesson.muxAssetId);
            });
        });

        // 3. Delete from Utils/DB
        await prisma.course.delete({
            where: {
                id: courseId,
            },
        });

        // 4. Delete from S3
        if (keysToDelete.length > 0) {
            await deleteFilesFromS3(keysToDelete);
        }

        // 5. Delete Mux assets
        if (muxAssetIds.length > 0) {
            await deleteMuxAssets(muxAssetIds);
        }

        revalidatePath("/teacher/courses");
        revalidatePath("/teacher");

        return {
            status: "success",
            message: "Course deleted",
        };
    } catch (err) {
        console.error("[deleteTeacherCourse] Error deleting course:", err);
        return {
            status: "error",
            message: "We couldn't delete this course. Please try again.",
        };
    }
}
