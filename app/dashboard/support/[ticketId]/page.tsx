import { requireUser } from "@/app/data/user/require-user";
import { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { notFound } from "next/navigation";
import { TicketDetailView } from "./_components/TicketDetailView";

export default async function StudentTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const user = await requireUser();
  const { ticketId } = await params;
  const ticket = await getTicketDetails(ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <div className="p-6">
      <TicketDetailView
        ticket={ticket}
        currentUserId={user.id}
        backHref="/dashboard/support"
        role="student"
      />
    </div>
  );
}
