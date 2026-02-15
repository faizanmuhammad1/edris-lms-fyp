"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

export async function getUserTickets(filters?: {
  status?: string;
  category?: string;
  search?: string;
}) {
  const user = await requireUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    createdById: user.id,
  };

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.category && filters.category !== "all") {
    where.category = filters.category;
  }

  if (filters?.search) {
    where.OR = [
      { subject: { contains: filters.search, mode: "insensitive" } },
      { ticketNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
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
