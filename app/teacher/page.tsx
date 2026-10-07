import { getTeacherDashboardStats } from "@/app/data/teacher/get-teacher-dashboard-stats";
import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { SectionCards } from "@/components/sidebar/section-cards";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    IconBook,
    IconPlaylistX,
    IconStar,
    IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";

const S3_URL = process.env.NEXT_PUBLIC_S3_DEV_URL || "";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
    const [stats, courses] = await Promise.all([
        getTeacherDashboardStats(),
        getTeacherCourses(),
    ]);

    const recentCourses = courses.slice(0, 4);

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

                {recentCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/teacher/courses/${course.id}/edit`}
                                className="group block rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="aspect-video relative bg-muted">
                                    {course.fileKey && S3_URL ? (
                                        <Image
                                            src={`${S3_URL}/${course.fileKey}`}
                                            alt={course.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <IconBook className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={course.status === "Published" ? "default" : "secondary"} className="text-xs">
                                            {course.status}
                                        </Badge>
                                        {course.level && (
                                            <Badge variant="outline" className="text-xs">
                                                {course.level}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        ${course.price?.toFixed(2) || "Free"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
                        <p>You haven&apos;t created any courses yet.</p>
                        <Button asChild variant="link" className="mt-2">
                            <Link href="/teacher/courses/create">
                                Create your first course
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

