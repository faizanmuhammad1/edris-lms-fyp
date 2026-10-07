"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TeacherPerformanceRow } from "@/app/data/admin/admin-get-analytics-extended";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface TeacherPerformanceTableProps {
  data: TeacherPerformanceRow[];
}

export function TeacherPerformanceTable({ data }: TeacherPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teachers performance</CardTitle>
        <CardDescription>
          Revenue and enrollments per teacher. Best-selling course shown per teacher.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Enrollments</TableHead>
              <TableHead className="text-right">Courses</TableHead>
              <TableHead>Best-selling course</TableHead>
              <TableHead className="text-right">Course revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No enrollment data yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.teacherId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.teacherName}</p>
                      <p className="text-xs text-muted-foreground">{row.teacherEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">{row.enrollmentCount}</TableCell>
                  <TableCell className="text-right">{row.courseCount}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={row.topCourseTitle}>
                    {row.topCourseTitle}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(row.topCourseRevenue)} ({row.topCourseEnrollments})
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
