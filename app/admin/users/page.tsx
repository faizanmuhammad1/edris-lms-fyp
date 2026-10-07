import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { PageHeader } from "@/components/general/PageHeader";
import { LoadingRegion, StatCardsSkeleton, TableSkeleton } from "../_components/AdminSkeletons";
import { UserManagementView } from "./_components/UserManagementView";

export const metadata = {
  title: "Admin · Users",
  description: "Manage all users on the platform",
};

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      banReason: true,
      createdAt: true,
      _count: {
        select: {
          enrollment: true,
          courses: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function UsersPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Search, filter and manage every account. Change roles, ban or unban, and delete users."
      />

      <Suspense
        fallback={
          <LoadingRegion label="Loading users">
            <StatCardsSkeleton count={5} />
            <TableSkeleton />
          </LoadingRegion>
        }
      >
        <UserManagementList />
      </Suspense>
    </div>
  );
}

async function UserManagementList() {
  const [session, users] = await Promise.all([requireAdmin(), getUsers()]);
  return <UserManagementView users={users} currentUserId={session.user.id} />;
}
