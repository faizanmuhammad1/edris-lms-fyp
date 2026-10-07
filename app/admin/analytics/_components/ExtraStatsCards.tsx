import { BookOpen, CalendarDays, GraduationCap, Wallet } from "lucide-react";
import { StatCard, StatGrid } from "@/app/admin/_components/StatCard";
import { formatCents, formatNumber } from "@/app/admin/_lib/format";

interface ExtraStatsCardsProps {
  totalTeachers: number;
  totalCourses: number;
  publishedCourses: number;
  newEnrollmentsThisWeek: number;
  /** In cents. */
  revenueThisWeek: number;
}

export function ExtraStatsCards({
  totalTeachers,
  totalCourses,
  publishedCourses,
  newEnrollmentsThisWeek,
  revenueThisWeek,
}: ExtraStatsCardsProps) {
  const unpublished = Math.max(totalCourses - publishedCourses, 0);

  return (
    <StatGrid columns={4}>
      <StatCard
        label="Teachers"
        value={formatNumber(totalTeachers)}
        icon={GraduationCap}
        description="Approved or with the teacher role"
        href="/admin/teachers"
      />
      <StatCard
        label="Published courses"
        value={formatNumber(publishedCourses)}
        icon={BookOpen}
        description={`${formatNumber(totalCourses)} total · ${formatNumber(unpublished)} draft or archived`}
        href="/admin/courses"
      />
      <StatCard
        label="New enrollments"
        value={formatNumber(newEnrollmentsThisWeek)}
        icon={CalendarDays}
        description="Active, last 7 days"
      />
      <StatCard
        label="Revenue this week"
        value={formatCents(revenueThisWeek)}
        icon={Wallet}
        description="Last 7 days"
      />
    </StatGrid>
  );
}
