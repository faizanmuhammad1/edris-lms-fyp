import type { Metadata } from "next";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { CreateTicketForm } from "@/components/support/CreateTicketForm";
import { PageHeader } from "@/components/general/PageHeader";
import { PageContainer } from "../../_components/PageContainer";
import { studentCategoryOptions } from "../_components/student-categories";

export const metadata: Metadata = {
  title: "New Support Ticket",
};

export default async function StudentNewTicketPage() {
  const user = await requireUser();

  // Get the student's enrolled courses
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "Active" },
    include: {
      Course: {
        select: { id: true, title: true },
      },
    },
  });

  const courses = enrollments.map((e) => ({
    id: e.Course.id,
    title: e.Course.title,
  }));

  return (
    <PageContainer width="narrow">
      <PageHeader
        backHref="/dashboard/support"
        backLabel="Back to tickets"
        title="New support ticket"
        description="Describe your issue and we'll route it to the right person to help you."
      />
      <CreateTicketForm
        role="student"
        backHref="/dashboard/support"
        courses={courses}
        categoryOptions={studentCategoryOptions}
        showBackLink={false}
        showHeader={false}
      />
    </PageContainer>
  );
}
