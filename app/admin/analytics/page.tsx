import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/general/PageHeader";
import { EmptyState } from "@/components/general/EmptyState";
import { adminGetRevenueStats } from "@/app/data/admin/admin-get-revenue-stats";
import { adminGetAnalyticsExtended } from "@/app/data/admin/admin-get-analytics-extended";
import { adminGetPurchaseDetails } from "@/app/data/admin/admin-get-purchase-details";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { AnalyticsSection, SectionError } from "./_components/AnalyticsSection";
import { RevenueCards } from "./_components/RevenueCards";
import { RevenueChart } from "./_components/RevenueChart";
import { ExtraStatsCards } from "./_components/ExtraStatsCards";
import { TeacherPerformanceTable } from "./_components/TeacherPerformanceTable";
import { TopCoursesTable } from "./_components/TopCoursesTable";
import { PurchaseDetailTable } from "./_components/PurchaseDetailTable";

export const metadata: Metadata = {
  title: "Admin · Analytics",
};

const PURCHASE_LIMIT = 300;

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  // Load sections independently so one failing query doesn't blank the whole page.
  const [revenueResult, extendedResult, purchasesResult] = await Promise.allSettled([
    adminGetRevenueStats(),
    adminGetAnalyticsExtended(),
    adminGetPurchaseDetails(PURCHASE_LIMIT),
  ]);

  for (const result of [revenueResult, extendedResult, purchasesResult]) {
    if (result.status === "rejected") {
      unstable_rethrow(result.reason);
      console.error("Admin analytics query failed:", result.reason);
    }
  }

  const revenue = revenueResult.status === "fulfilled" ? revenueResult.value : null;
  const extended = extendedResult.status === "fulfilled" ? extendedResult.value : null;
  const purchases = purchasesResult.status === "fulfilled" ? purchasesResult.value : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Revenue & analytics"
        description="Revenue, earnings, teacher performance and best-selling courses across the platform."
      />

      <AnalyticsSection
        id="revenue"
        title="Revenue & earnings"
        description="Revenue counts active enrollments only; pending and cancelled purchases are excluded."
      >
        {revenue ? (
          <>
            <RevenueCards stats={revenue} />
            <RevenueChart data={revenue.revenueByDay} />
          </>
        ) : (
          <SectionError what="revenue figures" />
        )}
      </AnalyticsSection>

      <AnalyticsSection id="platform" title="Platform overview">
        {extended ? (
          <ExtraStatsCards
            totalTeachers={extended.totalTeachers}
            totalCourses={extended.totalCourses}
            publishedCourses={extended.publishedCourses}
            newEnrollmentsThisWeek={extended.newEnrollmentsThisWeek}
            revenueThisWeek={extended.revenueThisWeek}
          />
        ) : (
          <SectionError what="platform statistics" />
        )}
      </AnalyticsSection>

      <AnalyticsSection
        id="teachers"
        title="Teacher performance"
        description="Revenue and enrollments per teacher, with each teacher's best-selling course."
      >
        {extended ? (
          <TeacherPerformanceTable data={extended.teachersPerformance} />
        ) : (
          <SectionError what="teacher performance" />
        )}
      </AnalyticsSection>

      <AnalyticsSection id="top-courses" title="Best-selling courses" description="Top 15 courses by active enrollments.">
        {!extended ? (
          <SectionError what="best-selling courses" />
        ) : extended.topCoursesByRevenue.length === 0 ? (
          <EmptyState
            titleAs="h3"
            icon={Trophy}
            title="No course sales yet"
            description="Courses will be ranked here by revenue and by enrollments once students start enrolling."
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-6">
            <TopCoursesTable
              title="By revenue"
              description="Highest total revenue first"
              data={extended.topCoursesByRevenue}
            />
            <TopCoursesTable
              title="By enrollments"
              description="Most enrollments first"
              data={extended.topCoursesByEnrollments}
            />
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection
        id="purchases"
        title="Purchase history"
        description="Every enrollment: when, who purchased, which course, and which teacher."
      >
        {purchases ? (
          <PurchaseDetailTable data={purchases} limit={PURCHASE_LIMIT} />
        ) : (
          <SectionError what="purchase history" />
        )}
      </AnalyticsSection>
    </div>
  );
}
