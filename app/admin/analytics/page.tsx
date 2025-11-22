import { SectionCards } from "@/components/sidebar/section-cards";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { adminGetEnrollmentStats } from "@/app/data/admin/admin-get-enrollment-stats";

export const metadata = {
  title: "Analytics | Edris LMS",
};

export default async function AdminAnalyticsPage() {
  const data = await adminGetEnrollmentStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Overview of user growth and enrollments in the last 30 days
        </p>
      </div>

      <SectionCards />

      <ChartAreaInteractive data={data} />
    </div>
  );
}
