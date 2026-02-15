"use server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/app/data/teacher/require-teacher";

export async function getTeacherTickets(filters?: {
  status?: string;
  category?: string;
  tab?: "assigned" | "student" | "mine";
  search?: string;
}) {
  const session = await requireTeacher();
  const userId = session.user.id;

  // Get all course IDs this teacher owns
  const teacherCourses = await prisma.course.findMany({
    where: { userId },
    select: { id: true },
  });
  const courseIds = teacherCourses.map((c) => c.id);

  let where: any = {};

  const tab = filters?.tab || "assigned";

  if (tab === "assigned") {
    // Tickets directly assigned to this teacher
    where.assignedToId = userId;
    where.createdById = { not: userId };
  } else if (tab === "student") {
    // Tickets from students in teacher's courses (not assigned to teacher)
    where.courseId = { in: courseIds };
    where.createdById = { not: userId };
    where.assignedToId = { not: userId };
  } else if (tab === "mine") {
    // Teacher's own tickets (to admin)
    where.createdById = userId;
  }

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.category && filters.category !== "all") {
    where.category = filters.category;
  }

  if (filters?.search) {
    where.AND = [
      where.AND || {},
      {
        OR: [
          { subject: { contains: filters.search, mode: "insensitive" } },
          { ticketNumber: { contains: filters.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, image: true, role: true },
      },
      assignedTo: {
        select: { id: true, name: true, image: true, role: true },
      },
      course: {
        select: { id: true, title: true, slug: true },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets;
}
