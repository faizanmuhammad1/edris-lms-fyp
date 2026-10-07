import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { AdminTicketDetail } from "./_components/AdminTicketDetail";

export const metadata: Metadata = {
  title: "Admin · Support ticket",
};

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const session = await requireAdmin();
  const { ticketId } = await params;
  const ticket = await getTicketDetails(ticketId);

  if (!ticket) {
    notFound();
  }

  return <AdminTicketDetail ticket={ticket} currentUserId={session.user.id} />;
}
