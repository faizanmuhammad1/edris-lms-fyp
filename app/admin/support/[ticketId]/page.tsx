import { requireAdmin } from "@/app/data/admin/require-admin";
import { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { notFound } from "next/navigation";
import { AdminTicketDetail } from "./_components/AdminTicketDetail";

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

  return (
    <div className="p-6">
      <AdminTicketDetail
        ticket={ticket}
        currentUserId={session.user.id}
      />
    </div>
  );
}
