import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { getTicketDetails } from "@/app/data/support/get-ticket-details";
import { notFound } from "next/navigation";
import { TicketDetailView } from "@/app/dashboard/support/[ticketId]/_components/TicketDetailView";

export default async function TeacherTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const session = await requireTeacher();
  const { ticketId } = await params;
  const ticket = await getTicketDetails(ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <div className="p-6">
      <TicketDetailView
        ticket={ticket}
        currentUserId={session.user.id}
        backHref="/teacher/support"
      />
    </div>
  );
}
