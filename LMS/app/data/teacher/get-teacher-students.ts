import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherStudents() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    const students = await prisma.enrollment.findMany({
        where: {
            Course: {
                userId: teacherId,
            },
            status: "Active",
        },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            Course: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return students;
}

export async function getTeacherBannedEnrollments() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    return prisma.enrollment.findMany({
        where: {
            Course: { userId: teacherId },
            status: "Cancelled",
        },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            Course: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
}
