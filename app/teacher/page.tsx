import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, TrendingUp, Plus, BarChart3, Sparkles, ArrowRight, Zap, Target } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
    const session = await requireTeacher();

    // Get teacher's courses
    const courses = await prisma.course.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            _count: {
                select: {
                    enrollment: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Add mock data if no real courses exist
    const hasCourses = courses.length > 0;
    const mockStats = {
        totalCourses: 5,
        publishedCourses: 3,
        totalStudents: 927,
        draftCourses: 2,
    };

    const stats = hasCourses ? {
        totalCourses: courses.length,
        publishedCourses: courses.filter((c) => c.status === "Published").length,
        totalStudents: courses.reduce((acc, course) => acc + course._count.enrollment, 0),
        draftCourses: courses.filter((c) => c.status === "Draft").length,
    } : mockStats;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-7xl mx-auto p-6 space-y-8">
                {/* Enhanced Header with Animation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                Teacher Dashboard
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg">
                            Welcome back, <span className="font-semibold text-foreground">{session.user.name}</span>! 
                            <span className="ml-2">Manage your courses and track your impact.</span>
                        </p>
                    </div>
                    <Link href="/teacher/courses/new">
                        <Button 
                            size="lg" 
                            className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
                        >
                            <span className="relative z-10 flex items-center">
                                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                                Create New Course
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </Button>
                    </Link>
                </div>

                {/* Enhanced Stats Grid with Hover Effects */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 hover:border-primary/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                Total Courses
                            </CardTitle>
                            <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {stats.totalCourses}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {stats.publishedCourses} published
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                Total Students
                            </CardTitle>
                            <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                {stats.totalStudents.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Across all courses
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 hover:-translate-y-1 hover:border-green-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                Published
                            </CardTitle>
                            <div className="bg-green-500/10 p-3 rounded-xl group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-300">
                                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                                {stats.publishedCourses}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Live on platform
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                Drafts
                            </CardTitle>
                            <div className="bg-yellow-500/10 p-3 rounded-xl group-hover:bg-yellow-500/20 group-hover:scale-110 transition-all duration-300">
                                <BarChart3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
                                {stats.draftCourses}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                In progress
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Enhanced Quick Actions */}
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Quick Actions</CardTitle>
                                <CardDescription>Common tasks to help you get started</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/teacher/courses/new" className="group">
                            <Card className="h-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:shadow-lg cursor-pointer">
                                <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                                    <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                        <Plus className="h-8 w-8 text-primary group-hover:rotate-90 transition-transform duration-300" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Create Course</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Start a new course</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/teacher/courses" className="group">
                            <Card className="h-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:shadow-lg cursor-pointer">
                                <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                                        <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Manage Courses</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Edit and organize</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/teacher/analytics" className="group">
                            <Card className="h-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:shadow-lg cursor-pointer">
                                <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                                    <div className="p-4 bg-green-500/10 rounded-2xl group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-300">
                                        <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">View Analytics</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Track performance</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </CardContent>
                </Card>

                {/* Enhanced Recent Courses */}
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Your Courses</CardTitle>
                                    <CardDescription>Manage and edit your course content</CardDescription>
                                </div>
                            </div>
                            <Link href="/teacher/courses">
                                <Button variant="outline" size="sm" className="group">
                                    View All
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {courses.length === 0 ? (
                            <div className="space-y-4">
                                {/* Mock courses for demonstration */}
                                {[
                                    { id: "mock-1", title: "Complete Web Development Bootcamp", students: 245, status: "Published" },
                                    { id: "mock-2", title: "Advanced React Patterns", students: 189, status: "Published" },
                                    { id: "mock-3", title: "Python for Data Science", students: 156, status: "Draft" },
                                    { id: "mock-4", title: "UI/UX Design Masterclass", students: 203, status: "Published" },
                                    { id: "mock-5", title: "Mobile App Development", students: 134, status: "Draft" },
                                ].slice(0, 5).map((course, index) => (
                                    <div
                                        key={course.id}
                                        className="group flex items-center justify-between p-5 rounded-xl border border-border/50 hover:border-primary/30 bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-base group-hover:text-primary transition-colors">{course.title}</h4>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" />
                                                        {course.students} students enrolled
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge 
                                                variant={course.status === "Published" ? "default" : "secondary"}
                                                className="group-hover:scale-105 transition-transform"
                                            >
                                                {course.status}
                                            </Badge>
                                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-6 border-t border-border/50">
                                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            <strong>Demo Mode:</strong> Showing mock data. Create your first course to see real data!
                                        </p>
                                    </div>
                                    <Link href="/teacher/courses/new" className="block">
                                        <Button className="w-full group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25">
                                            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                                            Create Your First Course
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {courses.slice(0, 5).map((course) => (
                                    <Link
                                        key={course.id}
                                        href={`/teacher/courses/${course.id}/edit`}
                                        className="block group"
                                    >
                                        <div className="flex items-center justify-between p-5 rounded-xl border border-border/50 hover:border-primary/30 bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                                    <BookOpen className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-base group-hover:text-primary transition-colors">{course.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-3.5 w-3.5" />
                                                            {course._count.enrollment} students enrolled
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge 
                                                    variant={course.status === "Published" ? "default" : "secondary"}
                                                    className="group-hover:scale-105 transition-transform"
                                                >
                                                    {course.status}
                                                </Badge>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
