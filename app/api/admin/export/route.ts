import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, courses, enrollments] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teacherStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.findMany({
      select: {
        id: true,
        status: true,
        amount: true,
        createdAt: true,
        User: { select: { email: true, name: true } },
        Course: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const lines: string[] = [];

  lines.push("Users");
  lines.push(toCsvRow(["id", "name", "email", "role", "teacherStatus", "createdAt"]));
  for (const u of users) {
    lines.push(toCsvRow([u.id, u.name, u.email, u.role ?? "", u.teacherStatus ?? "", u.createdAt.toISOString()]));
  }
  lines.push("");

  lines.push("Courses");
  lines.push(toCsvRow(["id", "title", "status", "price", "teacherEmail", "teacherName", "createdAt"]));
  for (const c of courses) {
    lines.push(
      toCsvRow([
        c.id,
        c.title,
        c.status,
        c.price,
        c.user?.email ?? "",
        c.user?.name ?? "",
        c.createdAt.toISOString(),
      ])
    );
  }
  lines.push("");

  lines.push("Enrollments");
  lines.push(toCsvRow(["id", "status", "amount", "studentEmail", "studentName", "courseTitle", "createdAt"]));
  for (const e of enrollments) {
    lines.push(
      toCsvRow([
        e.id,
        e.status,
        e.amount,
        e.User?.email ?? "",
        e.User?.name ?? "",
        e.Course?.title ?? "",
        e.createdAt.toISOString(),
      ])
    );
  }

  const csv = lines.join("\r\n");
  const filename = `platform-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
