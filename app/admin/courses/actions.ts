"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteCourse(courseId: string) {
    await prisma.course.delete({
        where: { id: courseId },
    });
    revalidatePath("/admin/courses");
}

export async function archiveCourse(courseId: string) {
    await prisma.course.update({
        where: { id: courseId },
        data: { status: "Archived" },
    });
    revalidatePath("/admin/courses");
}

export async function publishCourse(courseId: string) {
    await prisma.course.update({
        where: { id: courseId },
        data: { status: "Published" },
    });
    revalidatePath("/admin/courses");
}

export async function unpublishCourse(courseId: string) {
    await prisma.course.update({
        where: { id: courseId },
        data: { status: "Draft" },
    });
    revalidatePath("/admin/courses");
}
