import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { teacherCategories } from "@/app/data/support/schemas";
import { PageHeader } from "@/components/general/PageHeader";
import { CreateTicketForm } from "@/components/support/CreateTicketForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New ticket" };

const CATEGORY_LABELS: Record<string, string> = {
  TechnicalIssue: "Technical Issue",
  CourseRelated: "Course Related",
  AccountIssue: "Account Issue",
  PaymentBilling: "Payment & Billing",
  CommunityForum: "Community & Forum",
  TeacherApplication: "Teacher Application",
  FeatureRequest: "Feature Request",
  Other: "Other",
};

const teacherCategoryOptions = teacherCategories.map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }));

export default async function TeacherNewTicketPage() {
  await requireTeacher();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* CreateTicketForm renders its own "Back to tickets" link, so the header has no back link */}
      <PageHeader
        title="New support ticket"
        description="Describe the problem and the platform team will get back to you in this ticket."
      />
      <CreateTicketForm role="teacher" backHref="/teacher/support" categoryOptions={teacherCategoryOptions} />
    </div>
  );
}
