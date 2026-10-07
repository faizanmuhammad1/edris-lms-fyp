"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { IconBan, IconCircleCheck, IconCircleX, IconUserCheck } from "@tabler/icons-react";
import { GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { approveTeacher, rejectTeacher, approveTeacherAgain } from "@/app/actions/admin/approve-teacher";
import { banUser, unbanUser } from "@/app/admin/users/actions";
import type { TeacherApplication } from "@/app/data/admin/get-teacher-applications";
import { RowActionsMenu } from "../../_components/RowActionsMenu";
import { ReasonDialog } from "../../_components/ReasonDialog";
import { StatusBadge, type BadgeTone } from "../../_components/StatusBadge";
import { formatNumber, getInitials } from "../../_lib/format";

type TeacherStatus = "pending" | "approved" | "rejected" | "banned" | "none";
type StatusFilter = "all" | "pending" | "approved" | "rejected" | "banned" | "removed";

type PendingAction =
  | { type: "approve"; teacher: TeacherApplication }
  | { type: "reject"; teacher: TeacherApplication }
  | { type: "approveAgain"; teacher: TeacherApplication }
  | { type: "ban"; teacher: TeacherApplication }
  | { type: "unban"; teacher: TeacherApplication };

/** Shown to the applicant when the admin leaves the rejection reason blank. */
const DEFAULT_REJECTION_REASON =
  "Thank you for applying. Your application doesn't meet our current requirements for teaching on the platform.";

const STATUS_META: Record<TeacherStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  banned: { label: "Banned", tone: "danger" },
  none: { label: "No application", tone: "neutral" },
};

export function getTeacherStatus(teacher: TeacherApplication): TeacherStatus {
  if (teacher.banned) return "banned";
  switch (teacher.teacherStatus) {
    case "Pending":
      return "pending";
    case "Approved":
      return "approved";
    case "Rejected":
      return "rejected";
    default:
      return "none";
  }
}

function displayName(teacher: TeacherApplication) {
  return teacher.name?.trim() || teacher.email;
}

function statusReason(teacher: TeacherApplication) {
  if (teacher.banned) return teacher.banReason;
  if (teacher.teacherStatus === "Rejected") return teacher.teacherRejectionReason;
  return null;
}

function TeacherIdentity({ teacher }: { teacher: TeacherApplication }) {
  const name = displayName(teacher);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={teacher.image || undefined} alt="" />
        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-sm text-muted-foreground">{teacher.email}</p>
      </div>
    </div>
  );
}

function AppliedDate({ date }: { date: Date | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const value = new Date(date);
  return (
    <time dateTime={value.toISOString()} title={format(value, "PPP p")} className="whitespace-nowrap">
      {formatDistanceToNow(value, { addSuffix: true })}
    </time>
  );
}

function TeacherRowActions({
  teacher,
  onRequest,
}: {
  teacher: TeacherApplication;
  onRequest: (action: PendingAction) => void;
}) {
  const status = getTeacherStatus(teacher);
  const name = displayName(teacher);
  return (
    <RowActionsMenu label={`Actions for ${name}`} heading={name}>
      {status === "pending" && (
        <>
          <DropdownMenuItem onSelect={() => onRequest({ type: "approve", teacher })}>
            <IconCircleCheck aria-hidden="true" />
            Approve application
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onRequest({ type: "reject", teacher })}>
            <IconCircleX aria-hidden="true" />
            Reject application
          </DropdownMenuItem>
        </>
      )}
      {status === "approved" && (
        <DropdownMenuItem variant="destructive" onSelect={() => onRequest({ type: "ban", teacher })}>
          <IconBan aria-hidden="true" />
          Ban teacher
        </DropdownMenuItem>
      )}
      {status === "rejected" && (
        <DropdownMenuItem onSelect={() => onRequest({ type: "approveAgain", teacher })}>
          <IconCircleCheck aria-hidden="true" />
          Approve after all
        </DropdownMenuItem>
      )}
      {status === "banned" && (
        <DropdownMenuItem onSelect={() => onRequest({ type: "unban", teacher })}>
          <IconUserCheck aria-hidden="true" />
          Unban and restore access
        </DropdownMenuItem>
      )}
      {status === "none" && <DropdownMenuItem disabled>No actions available</DropdownMenuItem>}
    </RowActionsMenu>
  );
}

export function TeacherManagementTable({ teachers }: { teachers: TeacherApplication[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // `pending` keeps dialog content while it animates closed; `openType` drives visibility.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [openType, setOpenType] = useState<PendingAction["type"] | null>(null);

  const request = (action: PendingAction) => {
    setPending(action);
    setOpenType(action.type);
  };
  const dialogProps = (type: PendingAction["type"]) => ({
    open: openType === type,
    onOpenChange: (open: boolean) => {
      if (!open) setOpenType(null);
    },
  });

  const pendingApplications = useMemo(
    () => teachers.filter((teacher) => getTeacherStatus(teacher) === "pending"),
    [teachers]
  );

  const filtered = useMemo(
    () =>
      teachers.filter((teacher) => {
        const status = getTeacherStatus(teacher);
        if (statusFilter === "all") return true;
        if (statusFilter === "removed") return status === "banned" || teacher.teacherStatus === "Rejected";
        return status === statusFilter;
      }),
    [teachers, statusFilter]
  );

  /** Runs an action that returns either `{ success, message | error }` or `{ status, message }`. */
  async function run(
    action: () => Promise<{ success: boolean; message?: string; error?: string } | { status: string; message: string }>,
    successMessage: string
  ) {
    try {
      const result = await action();
      const ok = "success" in result ? result.success : result.status === "success";
      if (!ok) {
        const message = "error" in result && result.error ? result.error : "message" in result ? result.message : undefined;
        toast.error(message || "Action failed. Please try again.");
        return false;
      }
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch {
      toast.error("Something went wrong. Check your connection and try again.");
      return false;
    }
  }

  const columns = useMemo<ColumnDef<TeacherApplication>[]>(
    () => [
      {
        id: "teacher",
        accessorFn: (teacher) => displayName(teacher).toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Teacher" />,
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <TeacherIdentity teacher={row.original} />
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = STATUS_META[getTeacherStatus(row.original)];
          return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
        },
      },
      {
        id: "applied",
        accessorFn: (teacher) => (teacher.teacherApplicationDate ? new Date(teacher.teacherApplicationDate).getTime() : 0),
        header: ({ column }) => <SortableHeader column={column} title="Applied" />,
        cell: ({ row }) => <AppliedDate date={row.original.teacherApplicationDate} />,
      },
      {
        id: "courses",
        accessorFn: (teacher) => teacher._count.courses,
        header: ({ column }) => <SortableHeader column={column} title="Courses" />,
        cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "reason",
        header: "Rejection / ban reason",
        cell: ({ row }) => {
          const reason = statusReason(row.original);
          return reason ? (
            <p className="max-w-[240px] truncate text-sm text-muted-foreground" title={reason}>
              {reason}
            </p>
          ) : (
            <span className="text-muted-foreground" aria-label="None">
              —
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <TeacherRowActions teacher={row.original} onRequest={request} />
          </div>
        ),
      },
    ],
    []
  );

  const renderMobileCard = (teacher: TeacherApplication) => {
    const meta = STATUS_META[getTeacherStatus(teacher)];
    const reason = statusReason(teacher);
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TeacherIdentity teacher={teacher} />
          </div>
          <TeacherRowActions teacher={teacher} onRequest={request} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          <span>
            Applied <AppliedDate date={teacher.teacherApplicationDate} />
          </span>
          <span className="tabular-nums">{formatNumber(teacher._count.courses)} courses</span>
        </div>
        {reason && <p className="mt-2 text-xs break-words text-muted-foreground">Reason: {reason}</p>}
      </div>
    );
  };

  const target = pending?.teacher;
  const targetName = target ? displayName(target) : "";

  return (
    <div className="space-y-8">
      {pendingApplications.length > 0 && (
        <section aria-labelledby="pending-applications-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="pending-applications-heading" className="text-lg font-semibold">
              Waiting for review ({formatNumber(pendingApplications.length)})
            </h2>
            <p className="text-sm text-muted-foreground">
              Approving gives the applicant access to the teacher dashboard.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pendingApplications.map((teacher) => {
              const name = displayName(teacher);
              return (
                <li key={teacher.id} className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-card p-4">
                  <TeacherIdentity teacher={teacher} />
                  <p className="text-xs text-muted-foreground">
                    Applied <AppliedDate date={teacher.teacherApplicationDate} />
                  </p>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="h-9"
                      aria-label={`Approve ${name}`}
                      onClick={() => request({ type: "approve", teacher })}
                    >
                      <IconCircleCheck aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      aria-label={`Reject ${name}`}
                      onClick={() => request({ type: "reject", teacher })}
                    >
                      <IconCircleX aria-hidden="true" />
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-teachers-heading" className="space-y-4">
        <h2 id="all-teachers-heading" className="text-lg font-semibold">
          All teachers and applicants
        </h2>
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(teacher) => teacher.id}
          getSearchText={(teacher) => `${teacher.name ?? ""} ${teacher.email}`}
          searchPlaceholder="Search by name or email"
          caption="Teachers and applicants"
          noResultsText={statusFilter === "all" ? "No teachers match your search." : "No teachers match this filter."}
          renderMobileCard={renderMobileCard}
          toolbar={
            <>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full min-[400px]:w-[190px]" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="removed">Removed (rejected or banned)</SelectItem>
                </SelectContent>
              </Select>
              {statusFilter !== "all" && (
                <Button variant="ghost" className="h-9" onClick={() => setStatusFilter("all")}>
                  Clear filter
                </Button>
              )}
            </>
          }
          emptyState={
            teachers.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No teacher applications yet"
                description="When someone applies to teach from the Teach page, their application appears here for review."
              />
            ) : undefined
          }
        />
      </section>

      <ConfirmDialog
        {...dialogProps("approve")}
        title={`Approve ${targetName} as a teacher?`}
        description="They'll get access to the teacher dashboard and can create, publish and sell courses."
        confirmLabel="Approve"
        onConfirm={() => (target ? run(() => approveTeacher(target.id), `${targetName} is now a teacher`) : undefined)}
      />

      <ReasonDialog
        {...dialogProps("reject")}
        title={`Reject ${targetName}'s application?`}
        description="They won't get teacher access. You can approve them later from this page."
        reasonLabel="Reason for the applicant"
        reasonHint="Shown to the applicant. Leave blank to send a standard message."
        placeholder="e.g. Please add details about your teaching experience and reapply."
        confirmLabel="Reject application"
        destructive
        onConfirm={(reason) =>
          target
            ? run(
                () => rejectTeacher(target.id, reason || DEFAULT_REJECTION_REASON),
                `${targetName}'s application was rejected`
              )
            : undefined
        }
      />

      <ConfirmDialog
        {...dialogProps("approveAgain")}
        title={`Approve ${targetName} after all?`}
        description="Their rejection reason will be cleared and they'll get access to the teacher dashboard."
        confirmLabel="Approve"
        onConfirm={() =>
          target ? run(() => approveTeacherAgain(target.id), `${targetName} is now a teacher`) : undefined
        }
      />

      <ReasonDialog
        {...dialogProps("ban")}
        title={`Ban ${targetName}?`}
        description="They'll be signed out of every device immediately and can't sign in, so they lose access to the teacher dashboard until unbanned. Their courses are not deleted."
        reasonLabel="Reason"
        reasonHint="Visible to admins only."
        placeholder="e.g. Repeated policy violations"
        confirmLabel="Ban teacher"
        destructive
        onConfirm={(reason) =>
          target ? run(() => banUser(target.id, reason || undefined), `${targetName} has been banned`) : undefined
        }
      />

      <ConfirmDialog
        {...dialogProps("unban")}
        title={`Unban ${targetName}?`}
        description="They'll be able to sign in again right away and get back the access they had before the ban."
        confirmLabel="Unban and restore access"
        onConfirm={() =>
          target ? run(() => unbanUser(target.id), `${targetName} has been unbanned. Access restored.`) : undefined
        }
      />
    </div>
  );
}
