import Link from "next/link";
import type { EnrolledCourseType } from "@/app/data/user/get-enrolled-courses";
import { getCourseProgress } from "@/app/dashboard/_components/progress-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Award, BookOpen, type LucideIcon } from "lucide-react";
import { CategoryChart } from "./CategoryChart";

interface StudentStatsOverviewProps {
  enrolledCourses: EnrolledCourseType[];
  certificatesCount: number;
}

const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">
            {value}
            {hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{hint}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Server-rendered overview; only the small category chart hydrates on the client. */
export function StudentStatsOverview({ enrolledCourses, certificatesCount }: StudentStatsOverviewProps) {
  const progressData = enrolledCourses.map((e) => ({
    title: e.Course.title,
    slug: e.Course.slug,
    ...getCourseProgress(e.Course),
  }));

  const totalCourses = enrolledCourses.length;
  const completedCourses = progressData.filter((d) => d.percentage >= 100).length;
  const inProgressCourses = progressData.filter((d) => d.percentage > 0 && d.percentage < 100).length;
  const averageProgress =
    totalCourses > 0 ? Math.round(progressData.reduce((sum, d) => sum + d.percentage, 0) / totalCourses) : 0;

  const categoryMap = new Map<string, number>();
  enrolledCourses.forEach((e) => {
    const category = e.Course.category || "Uncategorized";
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
  });
  const categoryData = Array.from(categoryMap.entries()).map(([category, count], index) => ({
    category,
    count,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Active courses" value={totalCourses} />
        <StatCard icon={Target} label="In progress" value={inProgressCourses} />
        <StatCard icon={TrendingUp} label="Average progress" value={`${averageProgress}%`} />
        <StatCard
          icon={Award}
          label="Certificates"
          value={certificatesCount}
          hint={completedCourses > 0 ? `${completedCourses} course${completedCourses === 1 ? "" : "s"} done` : undefined}
        />
      </div>

      {enrolledCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                <h3 className="text-base font-semibold">Course progress</h3>
              </CardTitle>
              <CardDescription>Lessons completed in each of your courses.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {progressData.map((course) => (
                  <li key={course.slug} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <Link
                        href={`/dashboard/${course.slug}`}
                        className="min-w-0 truncate py-0.5 font-medium hover:text-primary hover:underline"
                        title={course.title}
                      >
                        {course.title}
                      </Link>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {course.completedLessons}/{course.totalLessons}
                        <span className="hidden min-[400px]:inline"> lessons</span> · {course.percentage}%
                      </span>
                    </div>
                    <Progress value={course.percentage} aria-label={`${course.title} progress`} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-base font-semibold">Categories</h3>
              </CardTitle>
              <CardDescription>What you&apos;re studying.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col">
              <CategoryChart data={categoryData} />
              <ul className="w-full space-y-2">
                {categoryData.map((entry) => (
                  <li key={entry.category} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-muted-foreground">{entry.category}</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {entry.count}
                      <span className="sr-only"> {entry.count === 1 ? "course" : "courses"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
