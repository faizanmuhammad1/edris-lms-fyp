"use client";

import { useMemo } from "react";
import { IconUsers, IconShield, IconSchool, IconUser, IconBan } from "@tabler/icons-react";
import { StatCard, StatGrid } from "../../_components/StatCard";
import { formatNumber } from "../../_lib/format";
import { UserManagementTable } from "./UserManagementTable";

export type UserForManagement = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
  _count: { enrollment: number; courses: number };
};

export function UserManagementView({
  users,
  currentUserId,
}: {
  users: UserForManagement[];
  currentUserId: string;
}) {
  const stats = useMemo(() => {
    let admin = 0;
    let teacher = 0;
    let banned = 0;
    for (const user of users) {
      if (user.role === "admin") admin++;
      else if (user.role === "teacher") teacher++;
      if (user.banned) banned++;
    }
    return { total: users.length, admin, teacher, student: users.length - admin - teacher, banned };
  }, [users]);

  return (
    <div className="space-y-6">
      <section aria-labelledby="user-stats-heading">
        <h2 id="user-stats-heading" className="sr-only">
          User totals
        </h2>
        <StatGrid columns={5}>
          <StatCard label="Total users" value={formatNumber(stats.total)} icon={IconUsers} />
          <StatCard label="Admins" value={formatNumber(stats.admin)} icon={IconShield} tone="accent" />
          <StatCard label="Teachers" value={formatNumber(stats.teacher)} icon={IconSchool} tone="info" />
          <StatCard label="Students" value={formatNumber(stats.student)} icon={IconUser} tone="neutral" />
          <StatCard
            label="Banned"
            value={formatNumber(stats.banned)}
            icon={IconBan}
            tone={stats.banned > 0 ? "danger" : "neutral"}
            description={stats.banned > 0 ? "Can't sign in" : "No banned accounts"}
          />
        </StatGrid>
      </section>

      <section aria-labelledby="user-list-heading" className="space-y-4">
        <h2 id="user-list-heading" className="text-lg font-semibold">
          All users
        </h2>
        <UserManagementTable users={users} currentUserId={currentUserId} />
      </section>
    </div>
  );
}
