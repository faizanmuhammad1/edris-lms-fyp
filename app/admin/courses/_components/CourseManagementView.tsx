"use client";

import { useMemo } from "react";
import { IconBook, IconFilePencil, IconWorld, IconArchive } from "@tabler/icons-react";
import { StatCard, StatGrid } from "../../_components/StatCard";
import { formatNumber } from "../../_lib/format";
import { CourseManagementTable } from "./CourseManagementTable";

export type CourseForManagement = {
  id: string;
  title: string;
  slug: string;
  status: string;
  /** Whole currency units (not cents). */
  price: number;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  _count: { enrollment: number; chapter: number };
};

export function CourseManagementView({ courses }: { courses: CourseForManagement[] }) {
  const stats = useMemo(() => {
    const counts = { Draft: 0, Published: 0, Archived: 0 } as Record<string, number>;
    for (const course of courses) counts[course.status] = (counts[course.status] ?? 0) + 1;
    return { total: courses.length, draft: counts.Draft, published: counts.Published, archived: counts.Archived };
  }, [courses]);

  return (
    <div className="space-y-6">
      <section aria-labelledby="course-stats-heading">
        <h2 id="course-stats-heading" className="sr-only">
          Course totals
        </h2>
        <StatGrid columns={4}>
          <StatCard label="Total courses" value={formatNumber(stats.total)} icon={IconBook} />
          <StatCard
            label="Published"
            value={formatNumber(stats.published)}
            icon={IconWorld}
            tone="success"
            description="Visible in the catalog"
          />
          <StatCard
            label="Draft"
            value={formatNumber(stats.draft)}
            icon={IconFilePencil}
            tone="warning"
            description="Not visible to students"
          />
          <StatCard
            label="Archived"
            value={formatNumber(stats.archived)}
            icon={IconArchive}
            tone="neutral"
            description="Hidden, data kept"
          />
        </StatGrid>
      </section>

      <section aria-labelledby="course-list-heading" className="space-y-4">
        <h2 id="course-list-heading" className="text-lg font-semibold">
          All courses
        </h2>
        <CourseManagementTable courses={courses} />
      </section>
    </div>
  );
}
