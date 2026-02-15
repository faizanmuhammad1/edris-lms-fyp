import { adminGetRevenueStats } from "@/app/data/admin/admin-get-revenue-stats";
import { adminGetAnalyticsExtended } from "@/app/data/admin/admin-get-analytics-extended";
import { adminGetPurchaseDetails } from "@/app/data/admin/admin-get-purchase-details";
import { RevenueCards } from "./_components/RevenueCards";
import { RevenueChart } from "./_components/RevenueChart";
import { ExtraStatsCards } from "./_components/ExtraStatsCards";
import { TeacherPerformanceTable } from "./_components/TeacherPerformanceTable";
import { TopCoursesTable } from "./_components/TopCoursesTable";
import { PurchaseDetailTable } from "./_components/PurchaseDetailTable";

export const metadata = {
  title: "Revenue & Analytics | Edris LMS",
};

export default async function AdminAnalyticsPage() {
  const [revenueStats, extended, purchaseDetails] = await Promise.all([
    adminGetRevenueStats(),
    adminGetAnalyticsExtended(),
    adminGetPurchaseDetails(300),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Revenue & Analytics</h1>
        <p className="text-muted-foreground">
          Revenue, earnings, teacher performance, and top courses
        </p>
      </div>

      {/* Revenue Stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Revenue & Earnings</h2>
        <RevenueCards stats={revenueStats} />
        <RevenueChart data={revenueStats.revenueByDay} />
      </section>

      {/* Extra platform stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Platform overview</h2>
        <ExtraStatsCards
          totalTeachers={extended.totalTeachers}
          totalCourses={extended.totalCourses}
          publishedCourses={extended.publishedCourses}
          newEnrollmentsThisWeek={extended.newEnrollmentsThisWeek}
          revenueThisWeek={extended.revenueThisWeek}
        />
      </section>

      {/* Teachers performance */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Teachers performance</h2>
        <TeacherPerformanceTable data={extended.teachersPerformance} />
      </section>

      {/* Top courses */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Best-selling courses</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <TopCoursesTable
            title="By revenue"
            description="Top 15 courses by total revenue"
            data={extended.topCoursesByRevenue}
          />
          <TopCoursesTable
            title="By enrollments"
            description="Top 15 courses by enrollment count"
            data={extended.topCoursesByEnrollments}
          />
        </div>
      </section>

      {/* Single purchase detail table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Purchase history</h2>
        <PurchaseDetailTable data={purchaseDetails} />
      </section>
    </div>
  );
}
