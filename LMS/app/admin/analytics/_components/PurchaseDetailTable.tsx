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
import { Badge } from "@/components/ui/badge";
import type { PurchaseDetailRow } from "@/app/data/admin/admin-get-purchase-details";
import { format } from "date-fns";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Active":
      return "default";
    case "Cancelled":
      return "destructive";
    case "Pending":
      return "secondary";
    default:
      return "outline";
  }
}

interface PurchaseDetailTableProps {
  data: PurchaseDetailRow[];
}

export function PurchaseDetailTable({ data }: PurchaseDetailTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase history</CardTitle>
        <CardDescription>
          Every enrollment: when, who purchased, which course, and which teacher
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Purchased by</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No purchases yet
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(row.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {row.studentEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate" title={row.courseTitle}>
                      {row.courseTitle}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{row.teacherName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {row.teacherEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
