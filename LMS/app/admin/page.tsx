import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  IconUsers,
  IconBook,
  IconCurrencyDollar,
  IconSchool,
  IconUserPlus,
  IconAlertTriangle,
  IconChevronRight,
  IconTrendingUp,
} from "@tabler/icons-react";
import { format } from "date-fns";

export const metadata = {
  title: "Admin Dashboard | Edris LMS",
};

async function getAdminDashboardData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    newUsersThisMonth,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    activeEnrollments,
    totalRevenue,
    pendingTeachers,
    recentUsers,
    recentEnrollments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "Published" } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: "Active" } }),
    prisma.enrollment.aggregate({
      where: { status: "Active" },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { teacherStatus: "Pending" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
    prisma.enrollment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { status: "Active" },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        User: { select: { name: true, email: true } },
        Course: { select: { title: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    newUsersThisMonth,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    activeEnrollments,
    totalRevenue: totalRevenue._sum.amount || 0,
    pendingTeachers,
    recentUsers,
    recentEnrollments,
  };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key metrics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Users</CardDescription>
            <IconUsers className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{data.totalUsers}</CardTitle>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <IconTrendingUp className="h-3 w-3" />
              +{data.newUsersThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <IconCurrencyDollar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{formatCurrency(data.totalRevenue)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              From {data.activeEnrollments} enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Courses</CardDescription>
            <IconBook className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{data.totalCourses}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {data.publishedCourses} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Pending Teachers</CardDescription>
            <IconSchool className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{data.pendingTeachers}</CardTitle>
            {data.pendingTeachers > 0 && (
              <Link href="/admin/teachers" className="text-xs text-primary hover:underline">
                Review applications →
              </Link>
            )}
            {data.pendingTeachers === 0 && (
              <p className="text-xs text-muted-foreground">No pending applications</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {data.pendingTeachers > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <IconAlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="font-medium">
                {data.pendingTeachers} teacher application{data.pendingTeachers > 1 ? "s" : ""} pending review
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/teachers">Review Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <Link href="/admin/teachers">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <IconSchool className="h-5 w-5 text-primary" />
                <span className="font-medium">View Pending Teachers</span>
              </div>
              <IconChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <Link href="/admin/analytics">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <IconCurrencyDollar className="h-5 w-5 text-primary" />
                <span className="font-medium">View Recent Enrollments</span>
              </div>
              <IconChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <Link href="/admin/analytics">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <IconTrendingUp className="h-5 w-5 text-primary" />
                <span className="font-medium">Open Analytics</span>
              </div>
              <IconChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Users</CardTitle>
              <CardDescription>Newest registrations</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users yet</p>
              ) : (
                data.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <IconUserPlus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {user.role || "student"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(user.createdAt), "MMM d")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Enrollments</CardTitle>
              <CardDescription>Latest course purchases</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/analytics">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentEnrollments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No enrollments yet</p>
              ) : (
                data.recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/10 p-2 rounded-full">
                        <IconCurrencyDollar className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{enrollment.User.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {enrollment.Course.title}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-green-600">
                        {formatCurrency(enrollment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(enrollment.createdAt), "MMM d")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
