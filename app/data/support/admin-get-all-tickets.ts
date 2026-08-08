"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";

export async function adminGetAllTickets(filters?: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  assignedToId?: string;
}) {
  await requireAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.category && filters.category !== "all") {
    where.category = filters.category;
  }

  if (filters?.priority && filters.priority !== "all") {
    where.priority = filters.priority;
  }

  if (filters?.assignedToId && filters.assignedToId !== "all") {
    where.assignedToId = filters.assignedToId;
  }

  if (filters?.search) {
    where.OR = [
      { subject: { contains: filters.search, mode: "insensitive" } },
      { ticketNumber: { contains: filters.search, mode: "insensitive" } },
      { createdBy: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true, image: true, role: true },
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
