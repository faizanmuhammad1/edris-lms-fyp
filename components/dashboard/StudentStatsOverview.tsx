"use client";

import { useMemo } from "react";
import type { EnrolledCourseType } from "@/app/data/user/get-enrolled-courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface StudentStatsOverviewProps {
  enrolledCourses: EnrolledCourseType[];
  certificatesCount: number;
}

interface ProgressDatum {
  name: string;
  progress: number;
}

interface CategoryDatum {
  category: string;
  count: number;
}

function computeCourseProgress(course: EnrolledCourseType["Course"]): ProgressDatum {
  let totalLessons = 0;
  let completedLessons = 0;

  course.chapter.forEach((chapter) => {
    chapter.lessons.forEach((lesson) => {
      totalLessons += 1;
      const isCompleted = lesson.lessonProgress.some(
        (progress) => progress.lessonId === lesson.id && progress.completed
      );
      if (isCompleted) {
        completedLessons += 1;
      }
    });
  });

  const progress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    name: course.title,
    progress,
  };
}

const CATEGORY_COLORS = [
  "#6366F1",
  "#22C55E",
  "#F97316",
  "#EC4899",
  "#06B6D4",
  "#A855F7",
  "#EAB308",
];

export function StudentStatsOverview({
  enrolledCourses,
  certificatesCount,
}: StudentStatsOverviewProps) {
  const {
    totalCourses,
    inProgressCourses,
    completedCourses,
    averageProgress,
    progressData,
    categoryData,
  } = useMemo(() => {
      const progressData: ProgressDatum[] = enrolledCourses.map((e) =>
        computeCourseProgress(e.Course)
      );

      const totalCourses = enrolledCourses.length;
      const completedCourses = progressData.filter((d) => d.progress >= 100).length;
      const inProgressCourses = progressData.filter(
        (d) => d.progress > 0 && d.progress < 100
      ).length;
      const averageProgress =
        totalCourses > 0
          ? Math.round(
              progressData.reduce((sum, d) => sum + d.progress, 0) / totalCourses
            )
          : 0;

      const categoryMap = new Map<string, number>();
      enrolledCourses.forEach((e) => {
        const category = e.Course.category || "Uncategorized";
        categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
      });
      const categoryData: CategoryDatum[] = Array.from(
        categoryMap.entries()
      ).map(([category, count]) => ({ category, count }));

      return {
        totalCourses,
        inProgressCourses,
        completedCourses,
        averageProgress,
        progressData,
        categoryData,
      };
    }, [enrolledCourses]);

  return (
    <section className="mt-4 space-y-6">
      {/* Compact KPI strip */}
      <Card className="border-border/60 bg-card/60 shadow-sm">
        <CardContent className="py-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Active courses
            </p>
            <p className="mt-1 text-2xl font-semibold">{totalCourses}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              In progress
            </p>
            <p className="mt-1 text-2xl font-semibold">{inProgressCourses}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Avg. progress
            </p>
            <p className="mt-1 text-2xl font-semibold">{averageProgress}%</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Certificates
            </p>
            <p className="mt-1 text-2xl font-semibold">{certificatesCount}</p>
            {completedCourses > 0 && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {completedCourses} course
                {completedCourses === 1 ? "" : "s"} completed
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {enrolledCourses.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Learning insights</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] items-stretch">
              {/* Course progress chart */}
              <div className="h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={progressData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Progress"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="progress"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category distribution pie + legend */}
              <div className="h-[260px] w-full min-w-0 flex flex-col md:flex-row md:items-center">
                {categoryData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Enroll in courses to see your category breakdown.
                  </p>
                ) : (
                  <>
                    <div className="h-52 w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="count"
                            nameKey="category"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                            strokeWidth={1}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell
                                key={entry.category}
                                fill={
                                  CATEGORY_COLORS[
                                    index % CATEGORY_COLORS.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name) => [
                              `${value} course${value === 1 ? "" : "s"}`,
                              name,
                            ]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 flex-1 space-y-1 text-sm">
                      {categoryData.map((entry, index) => (
                        <div
                          key={entry.category}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[
                                    index % CATEGORY_COLORS.length
                                  ],
                              }}
                            />
                            <span className="text-muted-foreground">
                              {entry.category}
                            </span>
                          </div>
                          <span className="font-medium text-xs">
                            {entry.count} course
                            {entry.count === 1 ? "" : "s"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

