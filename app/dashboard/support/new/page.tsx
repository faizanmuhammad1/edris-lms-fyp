import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { CreateTicketForm } from "@/components/support/CreateTicketForm";
import { studentCategories } from "@/app/data/support/schemas";

const studentCategoryOptions = studentCategories.map((c) => {
  const labels: Record<string, string> = {
    TechnicalIssue: "Technical Issue",
    CourseRelated: "Course Related",
    AccountIssue: "Account Issue",
    PaymentBilling: "Payment & Billing",
    AssignmentGrading: "Assignment & Grading",
    CommunityForum: "Community & Forum",
    FeatureRequest: "Feature Request",
    Other: "Other",
  };
  return { value: c, label: labels[c] || c };
});

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
    <div className="p-6">
      <CreateTicketForm
        role="student"
        backHref="/dashboard/support"
        courses={courses}
        categoryOptions={studentCategoryOptions}
      />
    </div>
  );
}
