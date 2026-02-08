import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherAnalytics() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    const [
        totalRevenueData,
        totalStudents,
        totalCourses,
        totalPosts,
        recentEnrollments,
        coursePerformance,
    ] = await Promise.all([
        // Total Revenue
        prisma.enrollment.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                Course: {
                    userId: teacherId,
                },
                status: "Active",
            },
        }),

        // Total Students (Enrollments)
        prisma.enrollment.count({
            where: {
                Course: {
                    userId: teacherId,
                },
                status: "Active",
            },
        }),

        // Total Courses
        prisma.course.count({
            where: {
                userId: teacherId,
            },
        }),

        // Total Posts (Community Engagement)
        prisma.post.count({
            where: {
                userId: teacherId,
            },
        }),

        // Recent Enrollments
        prisma.enrollment.findMany({
            where: {
                Course: {
                    userId: teacherId,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
            include: {
                User: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                Course: {
                    select: {
                        title: true,
                    },
                },
            },
        }),

        // Course Performance (for list/table)
        prisma.course.findMany({
            where: {
                userId: teacherId,
            },
            select: {
                id: true,
                title: true,
                _count: {
                    select: {
                        enrollment: true,
                    },
                },
                price: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
    ]);

    // Calculate active communities (this might be expensive if many posts, but for a single teacher it's likely fine)
    // Optimization: Use separate query if needed.
    const activeCommunitiesCount = await prisma.post.groupBy({
        by: ["communityId"],
        where: {
            userId: teacherId,
        },
    }).then(groups => groups.length);


    return {
        totalRevenue: totalRevenueData._sum.amount || 0,
        totalStudents,
        totalCourses,
        totalPosts,
        activeCommunitiesCount,
        recentEnrollments,
        coursePerformance: coursePerformance.map(course => ({
            title: course.title,
            students: course._count.enrollment,
            revenue: course._count.enrollment * course.price, // Est. revenue per course
            price: course.price
        }))
    };
}
