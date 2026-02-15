"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { createTicketSchema, teacherRoutedCategories } from "./schemas";
import { revalidatePath } from "next/cache";

export async function createSupportTicket(formData: {
  subject: string;
  description: string;
  category: string;
  priority?: string;
  courseId?: string | null;
}) {
  const user = await requireUser();

  const validated = createTicketSchema.parse(formData);

  // Generate ticket number
  const count = await prisma.supportTicket.count();
  const ticketNumber = `TKT-${String(count + 1).padStart(5, "0")}`;

  // Determine who this ticket should be assigned to
  let assignedToId: string | null = null;

  const isTeacherRouted = teacherRoutedCategories.includes(
    validated.category as (typeof teacherRoutedCategories)[number]
  );

  if (isTeacherRouted && validated.courseId) {
    // Find the course teacher
    const course = await prisma.course.findUnique({
      where: { id: validated.courseId },
      select: { userId: true },
    });
    if (course) {
      assignedToId = course.userId;
    }
  }

  // If not teacher-routed or no course, assign to first available admin
  if (!assignedToId) {
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { id: true },
    });
    if (admin) {
      assignedToId = admin.id;
    }
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      subject: validated.subject,
      description: validated.description,
      category: validated.category as any,
      priority: (validated.priority as any) || "Medium",
      status: "Open",
      createdById: user.id,
      assignedToId,
      courseId: validated.courseId || null,
      messages: {
        create: {
          message: validated.description,
          senderId: user.id,
          isInternal: false,
        },
      },
    },
  });

  // Determine which role the user is to revalidate the correct path
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, teacherStatus: true },
  });

  if (dbUser?.role === "admin") {
    revalidatePath("/admin/support");
  } else if (
    dbUser?.role === "teacher" ||
    dbUser?.teacherStatus === "Approved"
  ) {
    revalidatePath("/teacher/support");
  } else {
    revalidatePath("/dashboard/support");
  }

  return { success: true, ticketId: ticket.id, ticketNumber: ticket.ticketNumber };
}
