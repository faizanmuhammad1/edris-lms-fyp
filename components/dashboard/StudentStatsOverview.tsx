"use client";

import { useMemo } from "react";
import type { EnrolledCourseType } from "@/app/data/user/get-enrolled-courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { ChartBar, PieChartIcon, Target, TrendingUp, Award, BookOpen } from "lucide-react";

interface StudentStatsOverviewProps {
  enrolledCourses: EnrolledCourseType[];
  certificatesCount: number;
}

interface ProgressDatum {
  name: string;
  progress: number;
  fill?: string;
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
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#10B981", // Emerald
  "#F43F5E", // Rose
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
    const rawProgressData: ProgressDatum[] = enrolledCourses.map((e) =>
      computeCourseProgress(e.Course)
    );

    // Apply color to each bar
    const progressData = rawProgressData.map((data, index) => ({
      ...data,
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-border/60 bg-card/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Courses
              </p>
              <p className="text-2xl font-bold">{totalCourses}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                In Progress
              </p>
              <p className="text-2xl font-bold">{inProgressCourses}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg. Progress
              </p>
              <p className="text-2xl font-bold">{averageProgress}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 rounded-full text-violet-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Certificates
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{certificatesCount}</p>
                {completedCourses > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ({completedCourses} done)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {enrolledCourses.length > 0 && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Course progress chart */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ChartBar className="w-4 h-4 text-primary" />
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={progressData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tickFormatter={(value) =>
                        value.length > 15 ? `${value.substring(0, 15)}...` : value
                      }
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border/50 p-3 rounded-lg shadow-lg">
                              <p className="text-sm font-medium mb-1 text-popover-foreground">
                                {payload[0].payload.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: payload[0].payload.fill }}
                                />
                                <span className="text-sm text-muted-foreground font-semibold">
                                  {payload[0].value}% Completed
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="progress"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    >
                      {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category distribution pie + legend */}
          <Card className="lg:col-span-1 border-border/60 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-primary" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {categoryData.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center">
                    Enroll in courses to see a category breakdown.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full gap-6">
                  <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="count"
                          nameKey="category"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          strokeWidth={0}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={entry.category}
                              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-popover border border-border/50 p-2.5 rounded-lg shadow-lg flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: payload[0].payload.fill || payload[0].color,
                                    }}
                                  />
                                  <span className="text-sm font-medium text-popover-foreground">
                                    {payload[0].name}: {payload[0].value}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Add a center label if desired, but empty space is fine too */}
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 content-start">
                    {categoryData.map((entry, index) => (
                      <div
                        key={entry.category}
                        className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                            }}
                          />
                          <span className="text-sm text-muted-foreground truncate">
                            {entry.category}
                          </span>
                        </div>
                        <span className="font-semibold text-sm">
                          {entry.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}


