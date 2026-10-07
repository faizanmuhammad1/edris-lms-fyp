import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  IconUsers,
  IconBook,
  IconCurrencyDollar,
  IconSchool,
  IconAlertTriangle,
  IconChevronRight,
  IconChartBar,
  IconMail,
  IconListDetails,
  IconShoppingCart,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { adminGetEnrollmentStats } from "@/app/data/admin/admin-get-enrollment-stats";
import { PageHeader } from "@/components/general/PageHeader";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { StatCard, StatGrid } from "./_components/StatCard";
import { StatusBadge, type BadgeTone } from "./_components/StatusBadge";
import { formatCents, formatNumber, getInitials, pluralize } from "./_lib/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Admin · Dashboard",
};

async function getAdminDashboardData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    newUsersThisMonth,
    totalCourses,
    publishedCourses,
    activeEnrollments,
    totalRevenue,
    pendingTeachers,
    recentUsers,
    recentEnrollments,
    enrollmentsByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "Published" } }),
    prisma.enrollment.count({ where: { status: "Active" } }),
    prisma.enrollment.aggregate({
      where: { status: "Active" },
      _sum: { amount: true },
    }),
    // Same definition as the Teachers page: banned applicants aren't awaiting review.
    prisma.user.count({ where: { teacherStatus: "Pending", OR: [{ banned: false }, { banned: null }] } }),
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
    adminGetEnrollmentStats(),
  ]);

  return {
    totalUsers,
    newUsersThisMonth,
    totalCourses,
    publishedCourses,
    activeEnrollments,
    // Stored in cents (Stripe amount_total).
    totalRevenueCents: totalRevenue._sum.amount ?? 0,
    pendingTeachers,
    recentUsers,
    recentEnrollments,
    enrollmentsByDay,
  };
}

const roleBadge: Record<string, { tone: BadgeTone; label: string }> = {
  admin: { tone: "accent", label: "Admin" },
  teacher: { tone: "info", label: "Teacher" },
};

const quickActions = [
  { href: "/admin/teachers", label: "Review teacher applications", icon: IconSchool },
  { href: "/admin/users", label: "Manage users", icon: IconUsers },
  { href: "/admin/courses", label: "Manage courses", icon: IconListDetails },
  { href: "/admin/mail/compose", label: "Send a mail campaign", icon: IconMail },
  { href: "/admin/analytics", label: "Revenue & analytics", icon: IconChartBar },
];

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getAdminDashboardData();
  const unpublished = data.totalCourses - data.publishedCourses;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Platform overview and key metrics." />

      {data.pendingTeachers > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <p className="text-sm font-medium">
              {pluralize(data.pendingTeachers, "teacher application")} waiting for review.
            </p>
          </div>
          <Link
            href="/admin/teachers"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Review applications
          </Link>
        </div>
      )}

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Key figures
        </h2>
        <StatGrid>
          <StatCard
            label="Total users"
            value={formatNumber(data.totalUsers)}
            icon={IconUsers}
            href="/admin/users"
            description={
              data.newUsersThisMonth > 0
                ? `+${formatNumber(data.newUsersThisMonth)} joined in the last 30 days`
                : "No new sign-ups in the last 30 days"
            }
          />
          <StatCard
            label="Total revenue"
            value={formatCents(data.totalRevenueCents)}
            icon={IconCurrencyDollar}
            tone="success"
            href="/admin/analytics"
            description={`From ${pluralize(data.activeEnrollments, "active enrollment")}`}
          />
          <StatCard
            label="Courses"
            value={formatNumber(data.totalCourses)}
            icon={IconBook}
            tone="info"
            href="/admin/courses"
            description={`${formatNumber(data.publishedCourses)} published · ${formatNumber(unpublished)} not published`}
          />
          <StatCard
            label="Pending teachers"
            value={formatNumber(data.pendingTeachers)}
            icon={IconSchool}
            tone={data.pendingTeachers > 0 ? "warning" : "neutral"}
            href="/admin/teachers"
            description={data.pendingTeachers > 0 ? "Awaiting your review" : "No pending applications"}
          />
        </StatGrid>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ChartAreaInteractive data={data.enrollmentsByDay} title="New enrollments" />
        </div>

        <Card className="min-w-0 gap-4">
          <CardHeader>
            <CardTitle className="text-base">
              <h2>Quick actions</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4">
            <nav aria-label="Quick actions">
              <ul className="space-y-1">
                {quickActions.map((action) => (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <action.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{action.label}</span>
                      <IconChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="min-w-0 gap-4">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="text-base">
                <h2>Recent users</h2>
              </CardTitle>
              <CardDescription>Newest registrations</CardDescription>
            </div>
            <Link href="/admin/users" className={buttonVariants({ variant: "ghost", size: "sm", className: "h-9 shrink-0" })}>
              View all<span className="sr-only"> users</span>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="divide-y">
                {data.recentUsers.map((user) => {
                  const badge = roleBadge[user.role ?? ""] ?? { tone: "neutral" as const, label: "Student" };
                  return (
                    <li key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                          {getInitials(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name || user.email}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                        <time dateTime={new Date(user.createdAt).toISOString()} className="text-xs text-muted-foreground">
                          {format(new Date(user.createdAt), "MMM d")}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-4">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="text-base">
                <h2>Recent enrollments</h2>
              </CardTitle>
              <CardDescription>Latest course purchases</CardDescription>
            </div>
            <Link href="/admin/analytics" className={buttonVariants({ variant: "ghost", size: "sm", className: "h-9 shrink-0" })}>
              View all<span className="sr-only"> purchases</span>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentEnrollments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No enrollments yet.</p>
            ) : (
              <ul className="divide-y">
                {data.recentEnrollments.map((enrollment) => (
                  <li key={enrollment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <IconShoppingCart className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{enrollment.User.name || enrollment.User.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{enrollment.Course.title}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className={cn("text-sm font-medium tabular-nums", enrollment.amount > 0 && "text-emerald-700 dark:text-emerald-400")}>
                        {enrollment.amount > 0 ? formatCents(enrollment.amount) : "Free"}
                      </p>
                      <time
                        dateTime={new Date(enrollment.createdAt).toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        {format(new Date(enrollment.createdAt), "MMM d")}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
