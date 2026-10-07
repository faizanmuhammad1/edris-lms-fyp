import { TicketDetailView } from "@/app/dashboard/support/[ticketId]/_components/TicketDetailView";
import { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { requireTeacher } from "@/app/data/teacher/require-teacher";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Support ticket" };

export default async function TeacherTicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const session = await requireTeacher();
  const { ticketId } = await params;
  const ticket = await getTicketDetails(ticketId);

  if (!ticket) {
    notFound();
  }

  // TicketDetailView renders the page's h1 (ticket subject) and its own back link
  return <TicketDetailView ticket={ticket} currentUserId={session.user.id} backHref="/teacher/support" />;
}
