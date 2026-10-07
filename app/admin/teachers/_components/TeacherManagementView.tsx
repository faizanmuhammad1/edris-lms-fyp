"use client";

import { useMemo } from "react";
import { IconUsers, IconClock, IconCircleCheck, IconCircleX, IconBan } from "@tabler/icons-react";
import type { TeacherApplication } from "@/app/data/admin/get-teacher-applications";
import { StatCard, StatGrid } from "../../_components/StatCard";
import { formatNumber } from "../../_lib/format";
import { TeacherManagementTable, getTeacherStatus } from "./TeacherManagementTable";

export function TeacherManagementView({ applications }: { applications: TeacherApplication[] }) {
  const stats = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0, banned: 0 };
    for (const application of applications) {
      const status = getTeacherStatus(application);
      if (status !== "none") counts[status]++;
    }
    return { total: applications.length, ...counts };
  }, [applications]);

  return (
    <div className="space-y-8">
      <section aria-labelledby="teacher-stats-heading">
        <h2 id="teacher-stats-heading" className="sr-only">
          Application totals
        </h2>
        <StatGrid columns={5}>
          <StatCard label="Total" value={formatNumber(stats.total)} icon={IconUsers} description="Teachers and applicants" />
          <StatCard
            label="Pending"
            value={formatNumber(stats.pending)}
            icon={IconClock}
            tone={stats.pending > 0 ? "warning" : "neutral"}
            description={stats.pending > 0 ? "Need your review" : "Nothing to review"}
          />
          <StatCard label="Approved" value={formatNumber(stats.approved)} icon={IconCircleCheck} tone="success" description="Active teachers" />
          <StatCard label="Rejected" value={formatNumber(stats.rejected)} icon={IconCircleX} tone="neutral" description="Applications declined" />
          <StatCard
            label="Banned"
            value={formatNumber(stats.banned)}
            icon={IconBan}
            tone={stats.banned > 0 ? "danger" : "neutral"}
            description="Can't sign in"
          />
        </StatGrid>
      </section>

      <TeacherManagementTable teachers={applications} />
    </div>
  );
}
