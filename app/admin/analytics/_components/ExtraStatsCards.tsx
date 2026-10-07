"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconSchool, IconBook, IconTrendingUp, IconCalendarWeek } from "@tabler/icons-react";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface ExtraStatsCardsProps {
  totalTeachers: number;
  totalCourses: number;
  publishedCourses: number;
  newEnrollmentsThisWeek: number;
  revenueThisWeek: number;
}

export function ExtraStatsCards({
  totalTeachers,
  totalCourses,
  publishedCourses,
  newEnrollmentsThisWeek,
  revenueThisWeek,
}: ExtraStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Total teachers</CardDescription>
          <IconSchool className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl font-bold">{totalTeachers}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Approved or teacher role
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Courses</CardDescription>
          <IconBook className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl font-bold">{publishedCourses}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {totalCourses} total ({totalCourses - publishedCourses} draft/archived)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>This week</CardDescription>
          <IconCalendarWeek className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl font-bold">{newEnrollmentsThisWeek}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            New enrollments (last 7 days)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Revenue this week</CardDescription>
          <IconTrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl font-bold">
            {formatCurrency(revenueThisWeek)}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Last 7 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
