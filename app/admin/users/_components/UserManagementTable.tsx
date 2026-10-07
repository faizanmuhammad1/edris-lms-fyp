"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  IconBan,
  IconShieldCheck,
  IconSchool,
  IconTrash,
  IconUser,
  IconUserCheck,
} from "@tabler/icons-react";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
import { RowActionsMenu } from "../../_components/RowActionsMenu";
import { ReasonDialog } from "../../_components/ReasonDialog";
import { StatusBadge, type BadgeTone } from "../../_components/StatusBadge";
import { formatNumber, getInitials, pluralize } from "../../_lib/format";
import { banUser, deleteUser, unbanUser, updateUserRole, type UserActionResult } from "../actions";
import type { UserForManagement } from "./UserManagementView";

type Role = "admin" | "teacher" | "student";
type RoleFilter = "all" | Role;
type StatusFilter = "all" | "active" | "banned";

type PendingAction =
  | { type: "ban"; user: UserForManagement }
  | { type: "unban"; user: UserForManagement }
  | { type: "delete"; user: UserForManagement }
  | { type: "role"; user: UserForManagement; role: Role };

const ROLE_META: Record<Role, { label: string; article: string; tone: BadgeTone }> = {
  admin: { label: "Admin", article: "an admin", tone: "accent" },
  teacher: { label: "Teacher", article: "a teacher", tone: "info" },
  student: { label: "Student", article: "a student", tone: "neutral" },
};

function normalizeRole(role: string | null): Role {
  return role === "admin" || role === "teacher" ? role : "student";
}

function displayName(user: UserForManagement) {
  return user.name?.trim() || user.email;
}

function RoleBadge({ role }: { role: string | null }) {
  const meta = ROLE_META[normalizeRole(role)];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

function AccountStatusBadge({ banned }: { banned: boolean | null }) {
  return banned ? <StatusBadge tone="danger">Banned</StatusBadge> : <StatusBadge tone="success">Active</StatusBadge>;
}

function UserIdentity({ user, isSelf }: { user: UserForManagement; isSelf: boolean }) {
  const name = displayName(user);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={user.image || undefined} alt="" />
        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium">
          <span className="truncate">{name}</span>
          {isSelf && <span className="shrink-0 text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}

function UserRowActions({
  user,
  isSelf,
  onRequest,
}: {
  user: UserForManagement;
  isSelf: boolean;
  onRequest: (action: PendingAction) => void;
}) {
  const role = normalizeRole(user.role);
  const name = displayName(user);
  return (
    <RowActionsMenu label={`Actions for ${name}`} heading={name}>
      {isSelf ? (
        <DropdownMenuItem disabled>You can&apos;t change your own account</DropdownMenuItem>
      ) : (
        <>
          {role !== "admin" && (
            <DropdownMenuItem onSelect={() => onRequest({ type: "role", user, role: "admin" })}>
              <IconShieldCheck aria-hidden="true" />
              Make admin
            </DropdownMenuItem>
          )}
          {role !== "teacher" && (
            <DropdownMenuItem onSelect={() => onRequest({ type: "role", user, role: "teacher" })}>
              <IconSchool aria-hidden="true" />
              Make teacher
            </DropdownMenuItem>
          )}
          {role !== "student" && (
            <DropdownMenuItem onSelect={() => onRequest({ type: "role", user, role: "student" })}>
              <IconUser aria-hidden="true" />
              Change to student
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem onSelect={() => onRequest({ type: "unban", user })}>
              <IconUserCheck aria-hidden="true" />
              Unban user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={() => onRequest({ type: "ban", user })}>
              <IconBan aria-hidden="true" />
              Ban user
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onSelect={() => onRequest({ type: "delete", user })}>
            <IconTrash aria-hidden="true" />
            Delete user
          </DropdownMenuItem>
        </>
      )}
    </RowActionsMenu>
  );
}

export function UserManagementTable({
  users,
  currentUserId,
}: {
  users: UserForManagement[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // `pending` keeps the dialog content while it animates closed; `openType` drives visibility.
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

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (roleFilter !== "all" && normalizeRole(user.role) !== roleFilter) return false;
        if (statusFilter === "banned" && !user.banned) return false;
        if (statusFilter === "active" && user.banned) return false;
        return true;
      }),
    [users, roleFilter, statusFilter]
  );

  /** Runs a server action, toasts its result and refreshes the list on success. */
  async function run(action: () => Promise<UserActionResult>, successMessage: string) {
    try {
      const result = await action();
      if (result.status === "error") {
        toast.error(result.message);
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

  const columns = useMemo<ColumnDef<UserForManagement>[]>(
    () => [
      {
        id: "user",
        accessorFn: (user) => displayName(user).toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <UserIdentity user={row.original} isSelf={row.original.id === currentUserId} />
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="max-w-[200px] space-y-1">
            <AccountStatusBadge banned={row.original.banned} />
            {row.original.banned && row.original.banReason && (
              <p className="truncate text-xs text-muted-foreground" title={row.original.banReason}>
                {row.original.banReason}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "enrollments",
        accessorFn: (user) => user._count.enrollment,
        header: ({ column }) => <SortableHeader column={column} title="Enrollments" />,
        cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "courses",
        accessorFn: (user) => user._count.courses,
        header: ({ column }) => <SortableHeader column={column} title="Courses created" />,
        cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "joined",
        accessorFn: (user) => new Date(user.createdAt).getTime(),
        header: ({ column }) => <SortableHeader column={column} title="Joined" />,
        cell: ({ row }) => (
          <time dateTime={new Date(row.original.createdAt).toISOString()} className="whitespace-nowrap">
            {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          </time>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <UserRowActions user={row.original} isSelf={row.original.id === currentUserId} onRequest={request} />
          </div>
        ),
      },
    ],
    [currentUserId]
  );

  const renderMobileCard = (user: UserForManagement) => {
    const isSelf = user.id === currentUserId;
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <UserIdentity user={user} isSelf={isSelf} />
          </div>
          <UserRowActions user={user} isSelf={isSelf} onRequest={request} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RoleBadge role={user.role} />
          <AccountStatusBadge banned={user.banned} />
        </div>
        {user.banned && user.banReason && (
          <p className="mt-2 text-xs break-words text-muted-foreground">Reason: {user.banReason}</p>
        )}
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Enrollments</dt>
            <dd className="font-medium tabular-nums">{formatNumber(user._count.enrollment)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Courses</dt>
            <dd className="font-medium tabular-nums">{formatNumber(user._count.courses)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Joined</dt>
            <dd className="font-medium">{format(new Date(user.createdAt), "MMM d, yyyy")}</dd>
          </div>
        </dl>
      </div>
    );
  };

  const filtersActive = roleFilter !== "all" || statusFilter !== "all";

  const toolbar = (
    <>
      <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
        <SelectTrigger className="w-full min-[400px]:w-[150px]" aria-label="Filter by role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="admin">Admins</SelectItem>
          <SelectItem value="teacher">Teachers</SelectItem>
          <SelectItem value="student">Students</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
        <SelectTrigger className="w-full min-[400px]:w-[150px]" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="banned">Banned</SelectItem>
        </SelectContent>
      </Select>
      {filtersActive && (
        <Button
          variant="ghost"
          className="h-9"
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("all");
          }}
        >
          Clear filters
        </Button>
      )}
    </>
  );

  const target = pending?.user;
  const targetName = target ? displayName(target) : "";
  const roleChange = pending?.type === "role" ? pending : null;

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(user) => user.id}
        getSearchText={(user) => `${user.name ?? ""} ${user.email}`}
        searchPlaceholder="Search by name or email"
        toolbar={toolbar}
        caption="Users"
        noResultsText={filtersActive ? "No users match these filters." : "No users match your search."}
        renderMobileCard={renderMobileCard}
        emptyState={
          users.length === 0 ? (
            <EmptyState icon={Users} title="No users yet" description="People who sign up will appear here." />
          ) : undefined
        }
      />

      <ConfirmDialog
        {...dialogProps("role")}
        title={
          roleChange
            ? roleChange.role === "student"
              ? `Change ${targetName} to student?`
              : `Make ${targetName} ${ROLE_META[roleChange.role].article}?`
            : "Change role?"
        }
        description={
          roleChange?.role === "admin"
            ? "Admins have full access to every user, course, payment and platform setting, including banning or deleting other accounts."
            : roleChange?.role === "teacher"
              ? "They'll get access to the teacher dashboard and can create, publish and sell courses."
              : `They'll lose access to the ${ROLE_META[normalizeRole(roleChange?.user.role ?? null)].label.toLowerCase()} dashboard. Courses they created stay on the platform.`
        }
        confirmLabel={
          roleChange?.role === "student" ? "Change to student" : `Make ${roleChange?.role ?? "admin"}`
        }
        onConfirm={() =>
          roleChange
            ? run(
                () => updateUserRole(roleChange.user.id, roleChange.role),
                `${targetName} is now ${ROLE_META[roleChange.role].article}`
              )
            : undefined
        }
      />

      <ReasonDialog
        {...dialogProps("ban")}
        title={`Ban ${targetName}?`}
        description="They'll be signed out of every device immediately and can't sign in until unbanned. Their account, courses and enrollments are kept."
        reasonLabel="Reason"
        reasonHint="Visible to admins only."
        placeholder="e.g. Spam in community forums"
        confirmLabel="Ban user"
        destructive
        onConfirm={(reason) =>
          target ? run(() => banUser(target.id, reason || undefined), `${targetName} has been banned`) : undefined
        }
      />

      <ConfirmDialog
        {...dialogProps("unban")}
        title={`Unban ${targetName}?`}
        description="They'll be able to sign in again right away, and the ban reason will be cleared."
        confirmLabel="Unban user"
        onConfirm={() => (target ? run(() => unbanUser(target.id), `${targetName} has been unbanned`) : undefined)}
      />

      <ConfirmDialog
        {...dialogProps("delete")}
        title={`Delete ${targetName}?`}
        description={
          <div className="space-y-2">
            <p>
              This permanently deletes the account for{" "}
              <strong className="break-all text-foreground">{target?.email}</strong> with their enrollments, progress,
              posts and quiz attempts.
            </p>
            {target && target._count.courses > 0 && (
              <p className="font-medium text-destructive">
                It also deletes the {pluralize(target._count.courses, "course")} they created, including every
                student&apos;s enrollment in {target._count.courses === 1 ? "it" : "them"}.
              </p>
            )}
            <p>This can&apos;t be undone. To block access but keep their data, ban them instead.</p>
          </div>
        }
        confirmLabel="Delete user"
        destructive
        onConfirm={() => (target ? run(() => deleteUser(target.id), `${targetName} has been deleted`) : undefined)}
      />
    </>
  );
}
