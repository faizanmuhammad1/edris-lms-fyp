"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

export async function getTicketDetails(ticketId: string) {
  const user = await requireUser();

  // Get user's role from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, teacherStatus: true },
  });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      course: {
        select: { id: true, title: true, slug: true, userId: true },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              teacherStatus: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    return null;
  }

  // Access control: 
  // - Admin can view any ticket
  // - Teacher can view tickets assigned to them OR from students in their courses
  // - Student can only view their own tickets
  const isAdmin = dbUser?.role === "admin";
  const isTeacher =
    dbUser?.role === "teacher" || dbUser?.teacherStatus === "Approved";
  const isCreator = ticket.createdById === user.id;
  const isAssignee = ticket.assignedToId === user.id;
  const isCourseTeacher = ticket.course?.userId === user.id;

  if (!isAdmin && !isCreator && !isAssignee && !(isTeacher && isCourseTeacher)) {
    return null;
  }

  // Internal notes are visible to admins, and to teachers handling a ticket
  // (assigned to it or teaching its course) that they did not create
  // themselves. A teacher who opened the ticket is treated as the requester.
  const canSeeInternal =
    isAdmin || (isTeacher && !isCreator && (isAssignee || isCourseTeacher));

  if (!canSeeInternal) {
    ticket.messages = ticket.messages.filter((msg) => !msg.isInternal);
  }

  return {
    ...ticket,
    currentUserRole: isAdmin ? "admin" : isTeacher ? "teacher" : "student",
    canEscalate: isTeacher && !isAdmin && !ticket.escalatedToAdmin,
    canAssign: isAdmin,
    canResolve: isAdmin || isAssignee || isCourseTeacher,
    canReopen: isCreator && (ticket.status === "Resolved" || ticket.status === "Closed"),
    canAddInternalNote: canSeeInternal,
  };
}
