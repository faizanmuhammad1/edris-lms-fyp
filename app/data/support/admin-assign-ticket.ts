"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { revalidatePath } from "next/cache";

export async function adminAssignTicket(
  ticketId: string,
  assignedToId: string
) {
  const session = await requireAdmin();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Verify the assignee exists
  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { id: true, name: true },
  });

  if (!assignee) {
    throw new Error("User not found");
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { assignedToId },
  });

  await prisma.ticketMessage.create({
    data: {
      message: `Ticket assigned to ${assignee.name}.`,
      isInternal: true,
      ticketId,
      senderId: session.user.id,
    },
  });

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath(`/admin/support`);
  revalidatePath(`/teacher/support`);

  return { success: true };
}
