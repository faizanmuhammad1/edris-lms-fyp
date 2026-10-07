import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherDashboardStats() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    // Total Courses owned by teacher
    const totalCourses = await prisma.course.count({
        where: { userId: teacherId },
    });

    // Total Students (Enrollments in teacher's courses)
    // This is count of enrollments, not unique students (simplified)
    // To get unique students, we'd need distinct userId from enrollments where course.userId = teacherId
    const totalStudents = await prisma.enrollment.count({
        where: {
            Course: {
                userId: teacherId,
            },
            status: "Active",
        },
    });

    // Total Lessons in teacher's courses
    const totalLessons = await prisma.lesson.count({
        where: {
            Chapter: {
                Course: {
                    userId: teacherId,
                },
            },
        },
    });

    // Total Reviews on teacher's courses
    const totalReviews = await prisma.review.count({
        where: {
            Course: {
                userId: teacherId,
            },
        },
    });

    return {
        totalCourses,
        totalStudents,
        totalLessons,
        totalReviews,
    };
}
