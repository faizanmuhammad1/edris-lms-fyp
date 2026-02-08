import { adminGetRevenueStats } from "@/app/data/admin/admin-get-revenue-stats";
import { RevenueCards } from "./_components/RevenueCards";
import { RevenueChart } from "./_components/RevenueChart";

export const metadata = {
  title: "Platform Analytics | Edris LMS",
};

export default async function AdminAnalyticsPage() {
  const revenueStats = await adminGetRevenueStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">
          Revenue, earnings, and platform performance overview
        </p>
      </div>

      {/* Revenue Stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Revenue & Earnings</h2>
        <RevenueCards stats={revenueStats} />
        <RevenueChart data={revenueStats.revenueByDay} />
      </section>
    </div>
  );
}
