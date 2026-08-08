import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherAnalytics() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    // 1. Get Teacher's Courses (Used to filter communities and reviews)
    const courses = await prisma.course.findMany({
        where: { userId: teacherId },
        select: { id: true }
    });
    const courseIds = courses.map(c => c.id);

    const [
        totalRevenueData,
        totalStudents,
        totalCourses,
        recentEnrollments,
        coursePerformance,
        totalReviews,
    ] = await Promise.all([
        // Total Revenue
        prisma.enrollment.aggregate({
            _sum: { amount: true },
            where: {
                Course: { userId: teacherId },
                status: "Active",
            },
        }),

        // Total Students (Enrollments)
        prisma.enrollment.count({
            where: {
                Course: { userId: teacherId },
                status: "Active",
            },
        }),

        // Total Courses
        prisma.course.count({
            where: { userId: teacherId },
        }),

        // Recent Enrollments
        prisma.enrollment.findMany({
            where: {
                Course: { userId: teacherId },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                User: {
                    select: { name: true, email: true, image: true },
                },
                Course: {
                    select: { title: true },
                },
            },
        }),

        // Course Performance
        prisma.course.findMany({
            where: { userId: teacherId },
            select: {
                id: true,
                title: true,
                enrollment: {
                    where: { status: "Active" },
                    select: { amount: true }
                },
                price: true,
            },
            orderBy: { createdAt: "desc" },
        }),

        // Total Reviews
        prisma.review.count({
            where: {
                courseId: { in: courseIds }
            }
        })
    ]);

    // NEW: Community Stats Logic
    // We want to count posts in communities LINKED to the teacher's courses

    // Find communities linked to teacher's courses
    const communities = await prisma.community.findMany({
        where: {
            courseId: { in: courseIds }
        },
        select: { id: true }
    });
    const communityIds = communities.map(c => c.id);

    let totalPosts = 0;
    let activeCommunitiesCount = 0;

    if (communityIds.length > 0) {
        // Count posts in these communities
        totalPosts = await prisma.post.count({
            where: {
                communityId: { in: communityIds }
            }
        });
        activeCommunitiesCount = communities.length;
    }


    return {
        totalRevenue: (totalRevenueData._sum.amount || 0) / 100,
        totalStudents,
        totalCourses,
        totalPosts,
        activeCommunitiesCount,
        totalReviews,
        recentEnrollments,
        coursePerformance: coursePerformance.map(course => {
            const activeStudents = course.enrollment.length;
            const revenueCents = course.enrollment.reduce((sum, e) => sum + e.amount, 0);

            return {
                title: course.title,
                students: activeStudents,
                revenue: revenueCents / 100,
                price: course.price
            };
        })
    };
}
