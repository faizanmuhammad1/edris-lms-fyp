"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";

export async function adminGetSupportStats() {
  await requireAdmin();

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    escalatedTickets,
    resolvedTickets,
    closedTickets,
    resolvedToday,
    createdToday,
  ] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: "Open" } }),
    prisma.supportTicket.count({ where: { status: "InProgress" } }),
    prisma.supportTicket.count({ where: { status: "Escalated" } }),
    prisma.supportTicket.count({ where: { status: "Resolved" } }),
    prisma.supportTicket.count({ where: { status: "Closed" } }),
    prisma.supportTicket.count({
      where: {
        resolvedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.supportTicket.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  // Category breakdown
  const categoryBreakdown = await prisma.supportTicket.groupBy({
    by: ["category"],
    _count: { id: true },
    where: {
      status: { in: ["Open", "InProgress", "Escalated"] },
    },
  });

  // Priority breakdown for active tickets
  const priorityBreakdown = await prisma.supportTicket.groupBy({
    by: ["priority"],
    _count: { id: true },
    where: {
      status: { in: ["Open", "InProgress", "Escalated"] },
    },
  });

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    escalatedTickets,
    resolvedTickets,
    closedTickets,
    resolvedToday,
    createdToday,
    activeTickets: openTickets + inProgressTickets + escalatedTickets,
    categoryBreakdown: categoryBreakdown.map((item) => ({
      category: item.category,
      count: item._count.id,
    })),
    priorityBreakdown: priorityBreakdown.map((item) => ({
      priority: item.priority,
      count: item._count.id,
    })),
  };
}
