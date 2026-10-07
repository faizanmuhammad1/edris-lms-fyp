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
import type { TopCourseRow } from "@/app/data/admin/admin-get-analytics-extended";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface TopCoursesTableProps {
  title: string;
  description: string;
  data: TopCourseRow[];
}

export function TopCoursesTable({ title, description, data }: TopCoursesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Enrollments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No enrollment data yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.courseId}>
                  <TableCell className="font-medium max-w-[220px] truncate" title={row.courseTitle}>
                    {row.courseTitle}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{row.teacherName}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right">{row.enrollmentCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
