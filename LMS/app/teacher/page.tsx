import { getTeacherDashboardStats } from "@/app/data/teacher/get-teacher-dashboard-stats";
import { SectionCards } from "@/components/sidebar/section-cards";
import { buttonVariants } from "@/components/ui/button";
import {
    IconBook,
    IconPlaylistX,
    IconStar,
    IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
    const stats = await getTeacherDashboardStats();

    const dashboardItems = [
        {
            title: "Total Courses",
            value: stats.totalCourses,
            icon: IconBook,
            description: "Courses you have created",
        },
        {
            title: "Total Enrollments",
            value: stats.totalStudents,
            icon: IconUsers,
            description: "Students enrolled in your courses",
        },
        {
            title: "Total Lessons",
            value: stats.totalLessons,
            icon: IconPlaylistX,
            description: "Total content across your courses",
        },
        {
            title: "Total Reviews",
            value: stats.totalReviews,
            icon: IconStar,
            description: "Reviews on your courses",
        },
    ];

    return (
        <div className="space-y-4">
            <SectionCards
                items={dashboardItems}
            />

            {/* Chart Placeholder - To be implemented with Teacher specific data */}
            {/* <ChartAreaInteractive data={...} /> */}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Courses</h2>
                    <Link
                        className={buttonVariants({ variant: "outline" })}
                        href="/teacher/courses"
                    >
                        View All Courses
                    </Link>
                </div>

                {/* Reuse the RenderRecentCourses logic or similar here, but for now just link to courses */}
                <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
                    <p>Recent courses will appear here.</p>
                    <Link href="/teacher/courses/create" className="text-primary hover:underline mt-2 inline-block">
                        Create a new course
                    </Link>
                </div>
            </div>
        </div>
    );
}
