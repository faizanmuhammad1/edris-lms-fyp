"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { revalidatePath } from "next/cache";

export async function reopenTicket(ticketId: string) {
  const user = await requireUser();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { createdById: true, status: true },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.createdById !== user.id) {
    throw new Error("You can only reopen your own tickets");
  }

  if (ticket.status !== "Resolved" && ticket.status !== "Closed") {
    throw new Error("Only resolved or closed tickets can be reopened");
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "Open",
      resolvedAt: null,
      closedAt: null,
    },
  });

  // Add system message
  await prisma.ticketMessage.create({
    data: {
      message: "This ticket has been reopened by the creator.",
      isInternal: false,
      ticketId,
      senderId: user.id,
    },
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath(`/teacher/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);

  return { success: true };
}
