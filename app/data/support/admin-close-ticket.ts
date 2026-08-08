"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { revalidatePath } from "next/cache";

export async function adminCloseTicket(ticketId: string) {
  const session = await requireAdmin();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "Closed",
      closedAt: new Date(),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      message: "This ticket has been closed by admin.",
      isInternal: false,
      ticketId,
      senderId: session.user.id,
    },
  });

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath(`/admin/support`);
  revalidatePath(`/dashboard/support`);
  revalidatePath(`/teacher/support`);

  return { success: true };
}
