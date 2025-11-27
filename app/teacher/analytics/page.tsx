"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  LineChart as LineChartIcon,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, PolarAngleAxis, RadialBar, RadialBarChart, XAxis, YAxis } from "recharts";

type Stats = {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalRevenue: number;
  avgCompletionRate: number;
  totalViews: number;
};

const initialStats: Stats = {
  totalCourses: 0,
  publishedCourses: 0,
  totalStudents: 0,
  totalRevenue: 0,
  avgCompletionRate: 0,
  totalViews: 0,
};

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
  { type: "enrollment", course: "Flutter Mobile", student: "Abigail Clark", time: "3 days ago", icon: Users },
] as const;

const engagementChannels = [
  { channel: "Organic", watch: 1820, completion: 74 },
  { channel: "Referral", watch: 1320, completion: 68 },
  { channel: "Paid", watch: 980, completion: 61 },
  { channel: "Social", watch: 1560, completion: 72 },
];

const satisfactionRing = [
  { name: "satisfaction", value: 86 },
  { name: "remaining", value: 14 },
];

const milestoneHighlights = [
  {
    title: "200K watch minutes",
    description: "Across premium cohorts in the last 30 days",
    time: "48 hours ago",
  },
  {
    title: "Top course rated 4.9⭐",
    description: "React Patterns reached 500+ reviews",
    time: "3 days ago",
  },
  {
    title: "New corporate cohort",
    description: "Finch Inc. enrolled 32 team members",
    time: "1 week ago",
  },
];

const overviewChartConfig: ChartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
};

const performanceChartConfig: ChartConfig = {
  students: {
    label: "Students",
    color: "hsl(var(--chart-1))",
  },
  completion: {
    label: "Completion %",
    color: "hsl(var(--chart-2))",
  },
};

const sentimentChartConfig: ChartConfig = {
  satisfaction: {
    label: "Satisfaction",
    color: "hsl(var(--chart-3))",
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
};

const channelChartConfig: ChartConfig = {
  watch: {
    label: "Watch time",
    color: "hsl(var(--chart-1))",
  },
  completion: {
    label: "Completion",
    color: "hsl(var(--chart-2))",
  },
};

const accentStyles = {
  primary: {
    glow: "from-primary/5 via-transparent to-transparent",
    iconBg: "bg-primary/10",
    iconHover: "group-hover:bg-primary/20",
    iconColor: "text-primary",
    valueGradient: "from-primary to-purple-500",
    shadow: "hover:shadow-primary/10",
  },
  blue: {
    glow: "from-blue-500/5 via-transparent to-transparent",
    iconBg: "bg-blue-500/10",
    iconHover: "group-hover:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueGradient: "from-blue-500 to-cyan-400",
    shadow: "hover:shadow-blue-500/10",
  },
  green: {
    glow: "from-green-500/5 via-transparent to-transparent",
    iconBg: "bg-green-500/10",
    iconHover: "group-hover:bg-green-500/20",
    iconColor: "text-green-600 dark:text-green-400",
    valueGradient: "from-green-500 to-emerald-400",
    shadow: "hover:shadow-green-500/10",
  },
  purple: {
    glow: "from-purple-500/5 via-transparent to-transparent",
    iconBg: "bg-purple-500/10",
    iconHover: "group-hover:bg-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    valueGradient: "from-purple-500 to-pink-400",
    shadow: "hover:shadow-purple-500/10",
  },
};

const statCards = [
  {
    key: "courses",
    title: "Courses live",
    accent: "primary" as const,
    icon: BookOpen,
    getValue: (stats: Stats) => stats.totalCourses.toString(),
    getSubtitle: (stats: Stats) => `${stats.publishedCourses} published · curated catalog`,
  },
  {
    key: "students",
    title: "Active students",
    accent: "blue" as const,
    icon: Users,
    getValue: (stats: Stats) => stats.totalStudents.toLocaleString(),
    getSubtitle: () => "Learning across all cohorts",
  },
  {
    key: "revenue",
    title: "Lifetime revenue",
    accent: "green" as const,
    icon: DollarSign,
    getValue: (stats: Stats) => {
      const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
      return formatter.format(stats.totalRevenue);
    },
    getSubtitle: () => "Creator royalties",
  },
  {
    key: "completion",
    title: "Completion rate",
    accent: "purple" as const,
    icon: Target,
    getValue: (stats: Stats) => `${stats.avgCompletionRate}%`,
    getSubtitle: () => "Learner discipline trend",
  },
];

export default function TeacherAnalyticsPage() {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [useMockData, setUseMockData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setStats({
          totalCourses: 5,
          publishedCourses: 3,
          totalStudents: 927,
          totalRevenue: 75653,
          avgCompletionRate: 74.8,
          totalViews: 12450,
        });
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
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const heroHighlights = [
    {
      label: "Engagement rate",
      value: "82%",
      change: "+6.4% vs last month",
    },
    {
      label: "Avg. completion",
      value: `${stats.avgCompletionRate}%`,
      change: "+3.1 points",
    },
    {
      label: "Watch time",
      value: "6.4h",
      change: "per active learner",
    },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.12),_transparent_40%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background/90 via-background/60 to-muted/40 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="absolute inset-0 opacity-60">
            <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle,_rgba(59,130,246,0.35),_transparent_55%)] blur-3xl" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Teacher command center
              </Badge>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                  <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                    Performance intelligence for your classroom brand
                  </span>
                </h1>
                <p className="text-muted-foreground md:text-lg">
                  Monitor cohorts, track engagement, and act on opportunities with live-friendly dashboards designed for creators.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/40 bg-background/80 p-4 shadow-inner transition hover:border-primary/30 hover:shadow-primary/10"
                  >
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-semibold">{item.value}</p>
                    <p className="text-xs text-primary/80">{item.change}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5 rounded-2xl border border-border/30 bg-background/70 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Live pulse</p>
                <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-300">
                  +18% vs last month
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-border/30 bg-primary/10 p-4 text-primary">
                  <p className="text-sm font-medium">Revenue this quarter</p>
                  <p className="text-3xl font-semibold text-foreground">{formatCurrency(stats.totalRevenue / 4)}</p>
                  <p className="text-xs text-primary/80">Projected pacing +14%</p>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium">New learners</p>
                      <p className="text-xs text-muted-foreground">7 day window</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-semibold">+93</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium">Certifications issued</p>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Award className="h-4 w-4" />
                      <span className="text-sm font-semibold">48</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => {
            const accent = accentStyles[card.accent];
            const Icon = card.icon;
            return (
              <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card
                  className={cn(
                    "group relative overflow-hidden border border-border/50 bg-gradient-to-br from-card to-card/70 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1",
                    accent.shadow,
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                      accent.glow,
                    )}
                  />
                  <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {card.title}
                    </CardTitle>
                    <div className={cn("rounded-xl p-3 transition-all duration-300 group-hover:scale-110", accent.iconBg, accent.iconHover)}>
                      <Icon className={cn("h-5 w-5", accent.iconColor)} />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className={cn("text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent", accent.valueGradient)}>{card.getValue(stats)}</div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3" />
                      {card.getSubtitle(stats)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="rounded-full border border-border/50 bg-muted/40 p-1 shadow-inner">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Performance
            </TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Engagement
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Growth curve</CardTitle>
                        <CardDescription>Enrollments & revenue the past 12 months</CardDescription>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2">
                        <LineChartIcon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={overviewChartConfig} className="h-[320px]">
                      <ComposedChart data={mockEnrollmentData}>
                        <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent className="backdrop-blur-sm" />} />
                        <Area
                          type="monotone"
                          dataKey="enrollments"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.4}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 3 }} />
                      </ComposedChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Momentum insights</CardTitle>
                        <CardDescription>Signals to keep your cohorts thriving</CardDescription>
                      </div>
                      <div className="rounded-lg bg-purple-500/10 p-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="rounded-2xl border border-border/40 bg-gradient-to-r from-primary/10 to-transparent p-4">
                      <p className="text-sm text-muted-foreground">Projected revenue</p>
                      <p className="text-3xl font-semibold">{formatCurrency(stats.totalRevenue * 1.18)}</p>
                      <p className="text-xs text-primary">+18% forecasted QoQ</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
                        <p className="text-sm text-muted-foreground">Average cohort size</p>
                        <p className="text-2xl font-semibold">{Math.round(stats.totalStudents / Math.max(1, stats.totalCourses))}</p>
                        <p className="text-xs text-emerald-500">Healthy 🎯</p>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
                        <p className="text-sm text-muted-foreground">View to enroll</p>
                        <p className="text-2xl font-semibold">38%</p>
                        <p className="text-xs text-primary">Improving by +4%</p>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {milestoneHighlights.map((item) => (
                        <div key={item.title} className="flex items-center justify-between rounded-xl border border-border/30 p-3 transition hover:border-primary/30">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Course runway</CardTitle>
                      <CardDescription>Students vs completion rate per course</CardDescription>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={performanceChartConfig} className="h-[360px]">
                    <BarChart data={mockCoursePerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" angle={-25} height={80} textAnchor="end" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Legend />
                      <ChartTooltip content={<ChartTooltipContent className="backdrop-blur-sm" />} />
                      <Bar dataKey="students" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="completion" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {mockCoursePerformance.map((course, index) => (
                <motion.div key={course.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group border border-border/40 bg-gradient-to-br from-card to-card/80 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        {course.name}
                        <Badge variant={course.completion >= 75 ? "default" : "secondary"}>{course.completion}%</Badge>
                      </CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                        <span className="text-sm text-muted-foreground">Students</span>
                        <span className="flex items-center gap-2 font-semibold">
                          <Users className="h-4 w-4" />
                          {course.students}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="flex items-center gap-2 font-semibold text-emerald-500">
                          <DollarSign className="h-4 w-4" />
                          {course.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Completion progress</span>
                          <span>{course.completion}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-500",
                              course.completion >= 75
                                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                : "bg-gradient-to-r from-amber-500 to-orange-400",
                            )}
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

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle>Learner sentiment</CardTitle>
                    <CardDescription>Based on post-course NPS survey</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ChartContainer config={sentimentChartConfig} className="mx-auto h-[260px] w-full max-w-[260px]">
                      <RadialBarChart innerRadius="65%" outerRadius="100%" data={satisfactionRing} startAngle={90} endAngle={450}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar dataKey="value" background cornerRadius={16} />
                        <ChartTooltip content={<ChartTooltipContent className="backdrop-blur-sm" />} />
                      </RadialBarChart>
                    </ChartContainer>
                    <div className="text-center">
                      <p className="text-4xl font-semibold text-emerald-500">86%</p>
                      <p className="text-sm text-muted-foreground">of learners would recommend</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle>Channel quality</CardTitle>
                    <CardDescription>Where students come from & how they convert</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={channelChartConfig} className="h-[300px]">
                      <BarChart data={engagementChannels}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="channel" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Legend />
                        <ChartTooltip content={<ChartTooltipContent className="backdrop-blur-sm" />} />
                        <Bar dataKey="watch" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="completion" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle>Engagement snapshot</CardTitle>
                    <CardDescription>Micro-interactions across modules</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/30 p-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Average session</p>
                        <p className="text-lg font-semibold">47 min</p>
                      </div>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        +12% trend
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Live labs attendance", value: "92%", tone: "text-emerald-500" },
                        { label: "Assignments on time", value: "84%", tone: "text-sky-500" },
                        { label: "Community replies", value: "68%", tone: "text-purple-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/30 p-3">
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className={cn("text-sm font-semibold", item.tone)}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Insights refresh every 15 minutes. Connect your automations to trigger personalized nudges.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Live feed</CardTitle>
                        <CardDescription>Most recent learner touchpoints</CardDescription>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockRecentActivity.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={activity.course + activity.time}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center justify-between rounded-2xl border border-border/40 bg-gradient-to-r from-muted/40 to-muted/20 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "rounded-2xl p-3 transition-transform duration-300 group-hover:scale-110",
                                activity.type === "enrollment"
                                  ? "bg-blue-100/80 dark:bg-blue-900/40"
                                  : activity.type === "completion"
                                    ? "bg-green-100/80 dark:bg-green-900/40"
                                    : "bg-amber-100/80 dark:bg-amber-900/40",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-5 w-5",
                                  activity.type === "enrollment"
                                    ? "text-blue-600 dark:text-blue-300"
                                    : activity.type === "completion"
                                      ? "text-green-600 dark:text-green-300"
                                      : "text-amber-600 dark:text-amber-300",
                                )}
                              />
                            </div>
                            <div>
                              <p className="font-medium">
                                <span className="font-semibold">{activity.student}</span>{" "}
                                {activity.type === "enrollment"
                                  ? "enrolled in"
                                  : activity.type === "completion"
                                    ? "completed"
                                    : "reviewed"}{" "}
                                <span className="text-primary">{activity.course}</span>
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {activity.time}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full border-primary/20 text-xs capitalize text-primary">
                            {activity.type}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Execution checklist</CardTitle>
                        <CardDescription>Proactive tasks that keep momentum</CardDescription>
                      </div>
                      <div className="rounded-lg bg-emerald-500/10 p-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { title: "Launch async Q&A for React Patterns", status: "Scheduled", emphasis: "text-primary" },
                      { title: "Send celebration email to 80%+ completers", status: "In progress", emphasis: "text-emerald-500" },
                      { title: "Record bonus lesson for UI/UX Design", status: "Drafting outline", emphasis: "text-amber-500" },
                    ].map((task) => (
                      <div key={task.title} className="rounded-2xl border border-border/30 p-4 transition hover:border-primary/30">
                        <p className="font-semibold">{task.title}</p>
                        <p className={cn("text-sm", task.emphasis)}>{task.status}</p>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-dashed border-border/40 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                      Automate next steps with custom workflows to stay ahead of enrollments.
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {useMockData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/60 dark:border-blue-900 dark:from-blue-950/30 dark:to-blue-900/10">
              <CardContent className="p-4">
                <p className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Sparkles className="h-4 w-4" />
                  <strong>Demo mode:</strong> Showing mock analytics data for demonstration purposes.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

