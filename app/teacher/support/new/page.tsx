import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { CreateTicketForm } from "@/components/support/CreateTicketForm";
import { teacherCategories } from "@/app/data/support/schemas";

const teacherCategoryOptions = teacherCategories.map((c) => {
  const labels: Record<string, string> = {
    TechnicalIssue: "Technical Issue",
    CourseRelated: "Course Related",
    AccountIssue: "Account Issue",
    PaymentBilling: "Payment & Billing",
    CommunityForum: "Community & Forum",
    TeacherApplication: "Teacher Application",
    FeatureRequest: "Feature Request",
    Other: "Other",
  };
  return { value: c, label: labels[c] || c };
});

export default async function TeacherNewTicketPage() {
  await requireTeacher();

  return (
    <div className="p-6">
      <CreateTicketForm
        role="teacher"
        backHref="/teacher/support"
        categoryOptions={teacherCategoryOptions}
      />
    </div>
  );
}
