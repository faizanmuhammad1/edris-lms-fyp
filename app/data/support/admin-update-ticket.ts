"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { updateTicketSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export async function adminUpdateTicket(
  ticketId: string,
  updates: {
    status?: string;
    priority?: string;
    category?: string;
    assignedToId?: string | null;
  }
) {
  const session = await requireAdmin();

  const validated = updateTicketSchema.parse(updates);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  const changes: string[] = [];

  if (validated.status) {
    data.status = validated.status;
    changes.push(`status changed to ${validated.status}`);

    if (validated.status === "Resolved") {
      data.resolvedAt = new Date();
    }
    if (validated.status === "Closed") {
      data.closedAt = new Date();
    }
  }

  if (validated.priority) {
    data.priority = validated.priority;
    changes.push(`priority changed to ${validated.priority}`);
  }

  if (validated.category) {
    data.category = validated.category;
    changes.push(`category changed to ${validated.category}`);
  }

  if (validated.assignedToId !== undefined) {
    data.assignedToId = validated.assignedToId;
    if (validated.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validated.assignedToId },
        select: { name: true },
      });
      changes.push(`assigned to ${assignee?.name || "Unknown"}`);
    } else {
      changes.push("unassigned");
    }
  }

  if (Object.keys(data).length > 0) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });

    // Add internal note about changes
    if (changes.length > 0) {
      await prisma.ticketMessage.create({
        data: {
          message: `Ticket updated: ${changes.join(", ")}.`,
          isInternal: true,
          ticketId,
          senderId: session.user.id,
        },
      });
    }
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath(`/admin/support`);
  revalidatePath(`/teacher/support`);
  revalidatePath(`/dashboard/support`);

  return { success: true };
}
