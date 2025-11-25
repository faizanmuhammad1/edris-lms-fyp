"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, TrendingUp, DollarSign, Eye, Clock, Award, Target, Sparkles, ArrowUpRight, Activity, BarChart3 } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

// Mock analytics data
const mockEnrollmentData = [
  { month: "Jan", enrollments: 45, revenue: 4455 },
  { month: "Feb", enrollments: 52, revenue: 5148 },
  { month: "Mar", enrollments: 48, revenue: 4752 },
  { month: "Apr", enrollments: 61, revenue: 6039 },
  { month: "May", enrollments: 55, revenue: 5445 },
  { month: "Jun", enrollments: 67, revenue: 6633 },
  { month: "Jul", enrollments: 73, revenue: 7227 },
  { month: "Aug", enrollments: 68, revenue: 6732 },
  { month: "Sep", enrollments: 79, revenue: 7821 },
  { month: "Oct", enrollments: 84, revenue: 8316 },
  { month: "Nov", enrollments: 91, revenue: 9009 },
  { month: "Dec", enrollments: 95, revenue: 9405 },
];

const mockCoursePerformance = [
  { name: "Web Dev Bootcamp", students: 245, revenue: 24255, completion: 78 },
  { name: "React Patterns", students: 189, revenue: 28161, completion: 82 },
  { name: "Python Data Science", students: 156, revenue: 20124, completion: 71 },
  { name: "UI/UX Design", students: 203, revenue: 18067, completion: 75 },
  { name: "Flutter Mobile", students: 134, revenue: 15946, completion: 68 },
];

const mockRecentActivity = [
  { type: "enrollment", course: "Web Dev Bootcamp", student: "John Doe", time: "2 hours ago", icon: Users },
  { type: "completion", course: "React Patterns", student: "Jane Smith", time: "5 hours ago", icon: Award },
  { type: "enrollment", course: "Python Data Science", student: "Mike Johnson", time: "1 day ago", icon: Users },
  { type: "review", course: "UI/UX Design", student: "Sarah Williams", time: "2 days ago", icon: Eye },
];

const chartConfig: ChartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
};

export default function TeacherAnalyticsPage() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgCompletionRate: 0,
    totalViews: 0,
  });
  const [useMockData, setUseMockData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // In a real app, you'd fetch this from an API route
        setStats({
          totalCourses: 5,
          publishedCourses: 3,
          totalStudents: 927,
          totalRevenue: 75653,
          avgCompletionRate: 74.8,
          totalViews: 12450,
        });
        setUseMockData(true);
      } catch (error) {
        setUseMockData(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Analytics Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Track your teaching performance and course statistics.
            </p>
          </div>
        </motion.div>

        {/* Enhanced Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
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
                <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stats.totalCourses}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {stats.publishedCourses} published
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1">
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
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {stats.totalStudents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Across all courses
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Total Revenue
                </CardTitle>
                <div className="bg-green-500/10 p-3 rounded-xl group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-300">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  ${stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Avg Completion
                </CardTitle>
                <div className="bg-purple-500/10 p-3 rounded-xl group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  {stats.avgCompletionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Course completion rate
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </div>

        {/* Enhanced Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Course Performance
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Recent Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Enrollment Trend */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Enrollment Trend</CardTitle>
                        <CardDescription>Monthly enrollments over the past year</CardDescription>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <AreaChart data={mockEnrollmentData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip 
                          content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm border-border/50" />} 
                        />
                        <Area
                          type="monotone"
                          dataKey="enrollments"
                          stroke="hsl(var(--chart-1))"
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.6}
                          className="drop-shadow-lg"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Revenue Growth</CardTitle>
                        <CardDescription>Monthly revenue in USD</CardDescription>
                      </div>
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <LineChart data={mockEnrollmentData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip 
                          content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm border-border/50" />} 
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                          className="drop-shadow-lg"
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Course Performance</CardTitle>
                      <CardDescription>Detailed performance metrics for each course</CardDescription>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[350px]">
                    <BarChart data={mockCoursePerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip 
                        content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm border-border/50" />} 
                      />
                      <Legend />
                      <Bar dataKey="students" fill="hsl(var(--chart-1))" name="Students" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="completion" fill="hsl(var(--chart-2))" name="Completion %" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCoursePerformance.map((course, index) => (
                <motion.div
                  key={course.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {course.name}
                        <Badge variant={course.completion >= 75 ? "default" : "secondary"}>
                          {course.completion}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Students:</span>
                        <span className="font-semibold flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.students}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Revenue:</span>
                        <span className="font-semibold flex items-center gap-1 text-green-600 dark:text-green-400">
                          <DollarSign className="h-4 w-4" />
                          {course.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Completion Rate</span>
                          <span className="text-xs font-medium">{course.completion}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              course.completion >= 75
                                ? "bg-gradient-to-r from-green-500 to-green-400"
                                : "bg-gradient-to-r from-yellow-500 to-yellow-400"
                            }`}
                            style={{ width: `${course.completion}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Recent Activity</CardTitle>
                      <CardDescription>Latest student interactions with your courses</CardDescription>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${
                              activity.type === "enrollment"
                                ? "bg-blue-100 dark:bg-blue-900"
                                : activity.type === "completion"
                                ? "bg-green-100 dark:bg-green-900"
                                : "bg-yellow-100 dark:bg-yellow-900"
                            } group-hover:scale-110 transition-transform duration-300`}>
                              <Icon className={`h-5 w-5 ${
                                activity.type === "enrollment"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : activity.type === "completion"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-yellow-600 dark:text-yellow-400"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">
                                <span className="font-semibold">{activity.student}</span>{" "}
                                {activity.type === "enrollment" ? "enrolled in" : activity.type === "completion" ? "completed" : "reviewed"}{" "}
                                <span className="text-primary">{activity.course}</span>
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3.5 w-3.5" />
                                {activity.time}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="group-hover:border-primary group-hover:text-primary transition-colors">
                            {activity.type}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {useMockData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
              <CardContent className="p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <strong>Demo Mode:</strong> Showing mock analytics data for demonstration purposes.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
