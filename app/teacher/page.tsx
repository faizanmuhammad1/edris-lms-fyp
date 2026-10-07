import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { getTeacherDashboardStats } from "@/app/data/teacher/get-teacher-dashboard-stats";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, BarChart3, BookOpen, ListVideo, Plus, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatCard, StatGrid } from "./_components/StatCard";
import { COURSE_GRID } from "./_components/TeacherSkeletons";
import { TeacherCourseCard } from "./courses/_components/TeacherCourseCard";

export const metadata: Metadata = { title: "Teacher dashboard" };

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const [stats, courses] = await Promise.all([getTeacherDashboardStats(), getTeacherCourses()]);

  const recentCourses = courses.slice(0, 4);
  const publishedCount = courses.filter((c) => c.status === "Published").length;
  const draftCount = courses.filter((c) => c.status === "Draft").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="An overview of your courses, students and reviews."
        actions={
          <>
            <Link className={buttonVariants({ variant: "outline", className: "h-10" })} href="/teacher/analytics">
              <BarChart3 aria-hidden="true" />
              Analytics
            </Link>
            <Link className={buttonVariants({ className: "h-10" })} href="/teacher/courses/create">
              <Plus aria-hidden="true" />
              Create course
            </Link>
          </>
        }
      />

      <section aria-labelledby="dashboard-stats-heading">
        <h2 id="dashboard-stats-heading" className="sr-only">
          Key figures
        </h2>
        <StatGrid>
          <StatCard
            label="Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            description={
              stats.totalCourses > 0
                ? `${publishedCount} published · ${draftCount} ${draftCount === 1 ? "draft" : "drafts"}`
                : "No courses yet"
            }
          />
          <StatCard
            label="Active enrollments"
            value={stats.totalStudents}
            icon={Users}
            description="Students enrolled in your courses"
          />
          <StatCard label="Lessons" value={stats.totalLessons} icon={ListVideo} description="Across all your courses" />
          <StatCard label="Reviews" value={stats.totalReviews} icon={Star} description="Left by your students" />
        </StatGrid>
      </section>

      <section aria-labelledby="recent-courses-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-courses-heading" className="text-lg font-semibold">
            Recent courses
          </h2>
          {courses.length > 0 && (
            <Link href="/teacher/courses" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all courses
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>

        {recentCourses.length > 0 ? (
          <ul className={COURSE_GRID} aria-labelledby="recent-courses-heading">
            {recentCourses.map((course) => (
              <li key={course.id} className="min-w-0">
                <TeacherCourseCard data={course} headingLevel="h3" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            titleAs="h3"
            icon={BookOpen}
            title="Create your first course"
            description="Add a title, description, price and thumbnail, then build chapters and lessons. Your course stays a private draft until you publish it."
            buttonText="Create course"
            href="/teacher/courses/create"
          />
        )}
      </section>
    </div>
  );
}
