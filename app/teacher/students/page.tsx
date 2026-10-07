import type { Metadata } from "next";
import { getTeacherStudents, getTeacherBannedEnrollments } from "@/app/data/teacher/get-teacher-students";
import { PageHeader } from "@/components/general/PageHeader";
import { StudentsTable } from "./_components/StudentsTable";
import type { EnrollmentRowStatus, StudentEnrollmentRow } from "./_components/types";

export const metadata: Metadata = { title: "Students" };

type Enrollment = Awaited<ReturnType<typeof getTeacherStudents>>[number];

function toRow(enrollment: Enrollment, status: EnrollmentRowStatus): StudentEnrollmentRow {
    return {
        id: enrollment.id,
        status,
        enrolledAt: enrollment.createdAt.toISOString(),
        amount: enrollment.amount,
        student: {
            name: enrollment.User.name || "Student",
            email: enrollment.User.email,
            image: enrollment.User.image,
        },
        course: { id: enrollment.Course.id, title: enrollment.Course.title },
    };
}

export default async function TeacherStudentsPage() {
    const [active, banned] = await Promise.all([getTeacherStudents(), getTeacherBannedEnrollments()]);

    const rows = [...active.map((e) => toRow(e, "Active")), ...banned.map((e) => toRow(e, "Banned"))];

    const summary =
        rows.length === 0
            ? "Manage who can access your courses."
            : `${active.length} active ${active.length === 1 ? "enrollment" : "enrollments"}` +
              (banned.length > 0 ? `, ${banned.length} banned` : "") +
              ". Ban or restore access, or remove a student and their course data.";

    return (
        <div className="space-y-6">
            <PageHeader title="Students" description={summary} />
            <StudentsTable rows={rows} />
        </div>
    );
}
