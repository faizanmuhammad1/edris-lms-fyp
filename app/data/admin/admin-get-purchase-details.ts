import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export interface PurchaseDetailRow {
  id: string;
  createdAt: Date;
  status: string;
  /** In CENTS (`Enrollment.amount`); format with `formatCents`. */
  amount: number;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseId: string;
  teacherName: string;
  teacherEmail: string;
}

/** Most recent enrollments of every status, newest first. */
export async function adminGetPurchaseDetails(limit = 300): Promise<PurchaseDetailRow[]> {
  await requireAdmin();

  const enrollments = await prisma.enrollment.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      amount: true,
      User: {
        select: { name: true, email: true },
      },
      Course: {
        select: {
          id: true,
          title: true,
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  return enrollments.map((e) => ({
    id: e.id,
    createdAt: e.createdAt,
    status: e.status,
    amount: e.amount,
    studentName: e.User.name,
    studentEmail: e.User.email,
    courseTitle: e.Course.title,
    courseId: e.Course.id,
    teacherName: e.Course.user.name,
    teacherEmail: e.Course.user.email,
  }));
}
