import { Suspense } from "react";
import { getTeacherApplications } from "@/app/data/admin/get-teacher-applications";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageHeader } from "@/components/general/PageHeader";
import { LoadingRegion, StatCardsSkeleton, TableSkeleton } from "../_components/AdminSkeletons";
import { TeacherManagementView } from "./_components/TeacherManagementView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Teachers",
  description: "Review teacher applications and manage teachers",
};

export default async function TeachersPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Review teacher applications, and ban or restore teachers when needed."
      />

      <Suspense
        fallback={
          <LoadingRegion label="Loading teachers">
            <StatCardsSkeleton count={5} />
            <TableSkeleton />
          </LoadingRegion>
        }
      >
        <TeacherApplicationsList />
      </Suspense>
    </div>
  );
}

async function TeacherApplicationsList() {
  const applications = await getTeacherApplications();
  return <TeacherManagementView applications={applications} />;
}
