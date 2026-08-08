"use server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { revalidatePath } from "next/cache";

export async function escalateTicket(ticketId: string, note?: string) {
  const session = await requireTeacher();
  const userId = session.user.id;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      assignedToId: true,
      escalatedToAdmin: true,
      course: { select: { userId: true } },
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Only the assigned teacher or course teacher can escalate
  if (ticket.assignedToId !== userId && ticket.course?.userId !== userId) {
    throw new Error("You don't have permission to escalate this ticket");
  }

  if (ticket.escalatedToAdmin) {
    throw new Error("This ticket has already been escalated to admin");
  }

  // Find an admin to assign to
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      escalatedToAdmin: true,
      status: "Escalated",
      assignedToId: admin?.id || null,
    },
  });

  // Add escalation message
  await prisma.ticketMessage.create({
    data: {
      message: note
        ? `Escalated to admin: ${note}`
        : "This ticket has been escalated to admin for further assistance.",
      isInternal: true,
      ticketId,
      senderId: userId,
    },
  });

  revalidatePath(`/teacher/support/${ticketId}`);
  revalidatePath(`/teacher/support`);
  revalidatePath(`/admin/support`);
  revalidatePath(`/admin/support/${ticketId}`);

  return { success: true };
}
