import { getTeacherAnalytics } from "@/app/data/teacher/get-teacher-analytics";
import { getTeacherTransactions } from "@/app/data/teacher/get-teacher-transactions";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, DollarSign, MessageSquare, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, formatDateTime, formatMoney, initials } from "../_components/format";
import { StatCard } from "../_components/StatCard";
import { CoursePerformanceTable, TransactionsTable } from "./_components/AnalyticsTables";
import { EnrollmentsByCourseChart } from "./_components/EnrollmentsByCourseChart";

export const metadata: Metadata = { title: "Analytics" };

export const dynamic = "force-dynamic";

export default async function TeacherAnalyticsPage() {
  const [data, transactions] = await Promise.all([getTeacherAnalytics(), getTeacherTransactions()]);

  const hasEnrollments = data.coursePerformance.some((c) => c.students > 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Revenue, enrollments and engagement across your courses." />

      <section aria-labelledby="analytics-kpis">
        <h2 id="analytics-kpis" className="sr-only">
          Key figures
        </h2>
        <div className="grid grid-cols-1 gap-4 @md/main:grid-cols-2 @4xl/main:grid-cols-3 @7xl/main:grid-cols-5">
          <StatCard label="Total revenue" value={formatMoney(data.totalRevenue)} icon={DollarSign} description="Lifetime earnings" />
          <StatCard label="Active enrollments" value={data.totalStudents} icon={Users} description="Students with access" />
          <StatCard label="Courses" value={data.totalCourses} icon={BookOpen} description="Published and drafts" />
          <StatCard
            label="Community posts"
            value={data.totalPosts}
            icon={MessageSquare}
            description={`In ${data.activeCommunitiesCount} ${data.activeCommunitiesCount === 1 ? "community" : "communities"}`}
          />
          <StatCard
            label="Reviews"
            value={data.totalReviews}
            icon={Star}
            description={
              <Link
                href="/teacher/reviews"
                className="-my-2.5 inline-flex min-h-10 items-center rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Manage reviews
              </Link>
            }
          />
        </div>
      </section>

      <div className="grid gap-6 @5xl/main:grid-cols-5">
        <Card className="min-w-0 @5xl/main:col-span-3">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Enrollments by course</h2>
            </CardTitle>
            <CardDescription>Active students in each course.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasEnrollments ? (
              <EnrollmentsByCourseChart
                data={data.coursePerformance.map((c) => ({ title: c.title, students: c.students }))}
              />
            ) : (
              <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No enrollments yet. Once students join your courses, you&apos;ll see how each course compares here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 @5xl/main:col-span-2">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Recent enrollments</h2>
            </CardTitle>
            <CardDescription>The latest students to join your courses.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentEnrollments.length === 0 ? (
              <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No enrollments yet.
              </p>
            ) : (
              <ul className="divide-y">
                {data.recentEnrollments.map((enrollment) => (
                  <li key={enrollment.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar className="size-9">
                      <AvatarImage src={enrollment.User.image ?? undefined} alt="" />
                      <AvatarFallback className="text-xs">{initials(enrollment.User.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="truncate text-sm font-medium">{enrollment.User.name}</p>
                        <time
                          dateTime={new Date(enrollment.createdAt).toISOString()}
                          className="shrink-0 text-xs text-muted-foreground"
                        >
                          {formatDate(enrollment.createdAt)}
                        </time>
                      </div>
                      <p className="break-words text-sm text-muted-foreground">
                        Enrolled in <span className="font-medium text-foreground">{enrollment.Course.title}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="course-performance-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="course-performance-heading" className="text-lg font-semibold">
            Course performance
          </h2>
          <p className="text-sm text-muted-foreground">Active students and revenue for each course.</p>
        </div>
        <CoursePerformanceTable data={data.coursePerformance} />
      </section>

      <section aria-labelledby="transactions-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="transactions-heading" className="text-lg font-semibold">
            Transaction history
          </h2>
          <p className="text-sm text-muted-foreground">Paid enrollments in your courses.</p>
        </div>
        <TransactionsTable
          data={transactions.map((t) => ({
            id: t.id,
            studentName: t.studentName,
            studentEmail: t.studentEmail,
            studentImage: t.studentImage,
            courseTitle: t.courseTitle,
            amount: t.amount,
            timestamp: new Date(t.date).getTime(),
            dateLabel: formatDateTime(t.date),
          }))}
        />
      </section>
    </div>
  );
}
