"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { createTicketSchema, teacherRoutedCategories } from "./schemas";
import { revalidatePath } from "next/cache";

const MAX_TICKET_NUMBER_ATTEMPTS = 5;

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: unknown }).code === "P2002"
  );
}

/**
 * Next sequential ticket number, derived from the most recently created
 * ticket (not count(), which reuses numbers after deletions). Concurrent
 * creators can still compute the same number, so callers retry on P2002.
 */
async function nextTicketNumber(): Promise<string> {
  const latest = await prisma.supportTicket.findFirst({
    orderBy: { createdAt: "desc" },
    select: { ticketNumber: true },
  });
  const parsed = latest ? Number.parseInt(latest.ticketNumber.replace(/^TKT-/, ""), 10) : 0;
  const last = Number.isFinite(parsed) ? parsed : await prisma.supportTicket.count();
  return `TKT-${String(last + 1).padStart(5, "0")}`;
}

export async function createSupportTicket(formData: {
  subject: string;
  description: string;
  category: string;
  priority?: string;
  courseId?: string | null;
}) {
  const user = await requireUser();

  const validated = createTicketSchema.parse(formData);

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

  const createWithNumber = async (ticketNumber: string) =>
    prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: validated.subject,
        description: validated.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: validated.category as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  let ticket: Awaited<ReturnType<typeof createWithNumber>> | null = null;
  for (let attempt = 1; !ticket; attempt++) {
    try {
      ticket = await createWithNumber(await nextTicketNumber());
    } catch (e) {
      // Another ticket took this number concurrently; recompute and retry.
      if (!isUniqueConstraintError(e) || attempt >= MAX_TICKET_NUMBER_ATTEMPTS) throw e;
    }
  }

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
