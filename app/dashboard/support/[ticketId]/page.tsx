import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/app/data/user/require-user";
import { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { PageContainer } from "../../_components/PageContainer";
import { TicketDetailView } from "./_components/TicketDetailView";

const loadTicket = cache(getTicketDetails);

type Params = Promise<{ ticketId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { ticketId } = await params;
  const ticket = await loadTicket(ticketId);
  return { title: ticket ? `${ticket.ticketNumber} · Support` : "Support ticket" };
}

export default async function StudentTicketDetailPage({ params }: { params: Params }) {
  const user = await requireUser();
  const { ticketId } = await params;
  const ticket = await loadTicket(ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <PageContainer>
      <TicketDetailView ticket={ticket} currentUserId={user.id} backHref="/dashboard/support" />
    </PageContainer>
  );
}
