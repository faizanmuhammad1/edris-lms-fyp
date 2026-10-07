"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { replySchema } from "./schemas";
import { revalidatePath } from "next/cache";

export async function replyToTicket(
  ticketId: string,
  formData: { message: string; isInternal?: boolean }
) {
  const user = await requireUser();

  const validated = replySchema.parse(formData);

  // Get user role
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, teacherStatus: true },
  });

  const isStaff =
    dbUser?.role === "admin" ||
    dbUser?.role === "teacher" ||
    dbUser?.teacherStatus === "Approved";

  // Get ticket to verify access
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      createdById: true,
      assignedToId: true,
      status: true,
      course: { select: { userId: true } },
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const isAdmin = dbUser?.role === "admin";
  const isCreator = ticket.createdById === user.id;
  const isAssignee = ticket.assignedToId === user.id;
  const isCourseTeacher = ticket.course?.userId === user.id;

  if (!isAdmin && !isCreator && !isAssignee && !isCourseTeacher) {
    throw new Error("You don't have permission to reply to this ticket");
  }

  // Only staff handling the ticket (not its creator) can add internal notes;
  // mirrors the visibility rule in get-ticket-details.ts.
  const isTeacher =
    dbUser?.role === "teacher" || dbUser?.teacherStatus === "Approved";
  const canAddInternal =
    isAdmin || (isTeacher && !isCreator && (isAssignee || isCourseTeacher));
  const isInternal = canAddInternal ? (validated.isInternal || false) : false;

  // Create the reply
  await prisma.ticketMessage.create({
    data: {
      message: validated.message,
      isInternal,
      ticketId,
      senderId: user.id,
    },
  });

  // Update ticket status to InProgress if it was Open and staff is replying
  if (ticket.status === "Open" && isStaff && !isCreator) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "InProgress", updatedAt: new Date() },
    });
  } else {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });
  }

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath(`/teacher/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);

  return { success: true };
}
