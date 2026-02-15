import { requireAdmin } from "@/app/data/admin/require-admin";
import { adminGetSupportStats } from "@/app/data/support/admin-get-support-stats";
import { AdminSupportDashboard } from "./_components/AdminSupportDashboard";

export default async function AdminSupportPage() {
  await requireAdmin();
  const stats = await adminGetSupportStats();

  return (
    <div className="p-6">
      <AdminSupportDashboard stats={stats} />
    </div>
  );
}
