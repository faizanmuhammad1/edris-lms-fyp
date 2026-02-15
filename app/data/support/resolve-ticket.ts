"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { revalidatePath } from "next/cache";

export async function resolveTicket(ticketId: string) {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, teacherStatus: true },
  });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      assignedToId: true,
      status: true,
      course: { select: { userId: true } },
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const isAdmin = dbUser?.role === "admin";
  const isAssignee = ticket.assignedToId === user.id;
  const isCourseTeacher = ticket.course?.userId === user.id;

  if (!isAdmin && !isAssignee && !isCourseTeacher) {
    throw new Error("You don't have permission to resolve this ticket");
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "Resolved",
      resolvedAt: new Date(),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      message: "This ticket has been marked as resolved.",
      isInternal: false,
      ticketId,
      senderId: user.id,
    },
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath(`/teacher/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath(`/dashboard/support`);
  revalidatePath(`/teacher/support`);
  revalidatePath(`/admin/support`);

  return { success: true };
}
