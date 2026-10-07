"use client";

import { banMember, getCommunityMembers, removeMember, unbanMember } from "@/app/actions/community";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, Ban, Loader2, RefreshCw, ShieldCheck, UserRoundX, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface MemberManagementProps {
  communityId: string;
}

type MembersResult = Awaited<ReturnType<typeof getCommunityMembers>>;
type MembersData = Extract<MembersResult, { success: true }>["data"];
type Member = MembersData["members"][number];
type BanRecord = MembersData["bans"][number];
type CommunityUser = Member["user"];

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

// Fixed locale + time zone so server and client render the same text.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function displayName(user: CommunityUser) {
  return user.name?.trim() || user.email;
}

function initials(user: CommunityUser) {
  const parts = displayName(user).split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

/**
 * Moderation panel for a community: lists active members and banned users with
 * search, and lets moderators ban, unban or remove (with content) a user.
 */
export function MemberManagement({ communityId }: MemberManagementProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id;

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [unbanningId, setUnbanningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getCommunityMembers(communityId);
      if (!result.success) {
        setState({ status: "error", message: result.error });
        return false;
      }
      setMembers(result.data.members);
      setBans(result.data.bans);
      setState({ status: "ready" });
      return true;
    } catch {
      setState({ status: "error", message: "We couldn't load the member list. Check your connection and try again." });
      return false;
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  /** Runs a moderation action, reports the outcome and refreshes the lists and page counts. */
  const moderate = useCallback(
    async (
      action: () => Promise<{ success: boolean; error?: string }>,
      successMessage: string,
      fallbackError: string
    ) => {
      try {
        const result = await action();
        if (!result.success) {
          toast.error(result.error || fallbackError);
          return false;
        }
        toast.success(successMessage);
        // Not awaited: let the confirm dialog close before its row leaves the list
        void load();
        router.refresh();
        return true;
      } catch {
        toast.error(fallbackError);
        return false;
      }
    },
    [load, router]
  );

  const handleBan = useCallback(
    (user: CommunityUser) =>
      moderate(
        () => banMember(communityId, user.id),
        `${displayName(user)} was banned from the community`,
        "Couldn't ban this member. Please try again."
      ),
    [communityId, moderate]
  );

  const handleRemove = useCallback(
    (user: CommunityUser) =>
      moderate(
        () => removeMember(communityId, user.id),
        `${displayName(user)} was removed and their posts and comments were deleted`,
        "Couldn't remove this member. Please try again."
      ),
    [communityId, moderate]
  );

  const handleUnban = useCallback(
    async (user: CommunityUser) => {
      setUnbanningId(user.id);
      try {
        await moderate(
          () => unbanMember(communityId, user.id),
          `${displayName(user)} was unbanned and can join again`,
          "Couldn't unban this user. Please try again."
        );
      } finally {
        setUnbanningId(null);
      }
    },
    [communityId, moderate]
  );

  const memberColumns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        id: "member",
        accessorFn: (row) => displayName(row.user).toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Member" />,
        cell: ({ row }) => (
          <UserIdentity
            user={row.original.user}
            badges={<MemberBadges member={row.original} isYou={row.original.user.id === currentUserId} />}
          />
        ),
      },
      {
        id: "joinedAt",
        accessorFn: (row) => new Date(row.joinedAt).getTime(),
        header: ({ column }) => <SortableHeader column={column} title="Joined" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dateFormatter.format(new Date(row.original.joinedAt))}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <MemberActions
              user={row.original.user}
              isYou={row.original.user.id === currentUserId}
              onBan={handleBan}
              onRemove={handleRemove}
            />
          </div>
        ),
      },
    ],
    [currentUserId, handleBan, handleRemove]
  );

  const banColumns = useMemo<ColumnDef<BanRecord>[]>(
    () => [
      {
        id: "user",
        accessorFn: (row) => displayName(row.user).toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="User" />,
        cell: ({ row }) => <UserIdentity user={row.original.user} />,
      },
      {
        id: "bannedAt",
        accessorFn: (row) => new Date(row.createdAt).getTime(),
        header: ({ column }) => <SortableHeader column={column} title="Banned on" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dateFormatter.format(new Date(row.original.createdAt))}
          </span>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="block max-w-xs text-sm break-words text-muted-foreground">
            {row.original.reason || "No reason recorded"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <BanActions
              user={row.original.user}
              unbanning={unbanningId === row.original.user.id}
              onUnban={handleUnban}
              onRemove={handleRemove}
            />
          </div>
        ),
      },
    ],
    [handleRemove, handleUnban, unbanningId]
  );

  if (state.status === "loading") {
    return <MemberListSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center"
        role="alert"
      >
        <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
        <p className="max-w-md text-sm text-muted-foreground">{state.message}</p>
        <Button variant="outline" className="h-10" onClick={reload} disabled={refreshing}>
          {refreshing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
          Try again
        </Button>
      </div>
    );
  }

  const refreshButton = (
    <Button
      variant="outline"
      size="icon"
      className="size-10"
      onClick={reload}
      disabled={refreshing}
      aria-label="Refresh member list"
      title="Refresh member list"
    >
      <RefreshCw className={refreshing ? "motion-safe:animate-spin" : undefined} aria-hidden="true" />
    </Button>
  );

  return (
    <Tabs defaultValue="members" className="gap-4">
      <TabsList className="h-10 w-full sm:w-fit" aria-label="Member lists">
        <TabsTrigger value="members" className="px-3">
          Members ({members.length})
        </TabsTrigger>
        <TabsTrigger value="banned" className="px-3">
          Banned ({bans.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members">
        <DataTable
          columns={memberColumns}
          data={members}
          getRowId={(row) => row.user.id}
          getSearchText={(row) => `${row.user.name ?? ""} ${row.user.email}`}
          searchPlaceholder="Search members by name or email"
          toolbar={refreshButton}
          caption="Community members"
          noResultsText="No members match your search."
          emptyState={
            <ListEmpty
              icon={<Users className="size-6 text-primary" aria-hidden="true" />}
              text="No one has joined yet. Enrolled students appear here once they join the community."
            />
          }
          renderMobileCard={(member) => {
            const isYou = member.user.id === currentUserId;
            return (
              <div className="space-y-3 rounded-xl border bg-card p-4">
                <UserIdentity user={member.user} badges={<MemberBadges member={member} isYou={isYou} />} />
                <p className="text-xs text-muted-foreground">
                  Joined {dateFormatter.format(new Date(member.joinedAt))}
                </p>
                <div className="flex flex-wrap gap-2 [&>*]:flex-1">
                  <MemberActions user={member.user} isYou={isYou} onBan={handleBan} onRemove={handleRemove} />
                </div>
              </div>
            );
          }}
        />
      </TabsContent>

      <TabsContent value="banned">
        <DataTable
          columns={banColumns}
          data={bans}
          getRowId={(row) => row.user.id}
          getSearchText={(row) => `${row.user.name ?? ""} ${row.user.email}`}
          searchPlaceholder="Search banned users by name or email"
          toolbar={refreshButton}
          caption="Banned users"
          noResultsText="No banned users match your search."
          emptyState={
            <ListEmpty
              icon={<ShieldCheck className="size-6 text-primary" aria-hidden="true" />}
              text="No one is banned. Users you ban appear here and can be unbanned at any time."
            />
          }
          renderMobileCard={(record) => (
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <UserIdentity user={record.user} />
              <dl className="space-y-1 text-xs text-muted-foreground">
                <div className="flex gap-1">
                  <dt>Banned on</dt>
                  <dd>{dateFormatter.format(new Date(record.createdAt))}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Reason:</dt>
                  <dd className="min-w-0 break-words">{record.reason || "No reason recorded"}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 [&>*]:flex-1">
                <BanActions
                  user={record.user}
                  unbanning={unbanningId === record.user.id}
                  onUnban={handleUnban}
                  onRemove={handleRemove}
                />
              </div>
            </div>
          )}
        />
      </TabsContent>
    </Tabs>
  );
}

function UserIdentity({ user, badges }: { user: CommunityUser; badges?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={user.image ?? undefined} alt="" />
        <AvatarFallback className="text-xs">{initials(user)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 font-medium break-words">{user.name?.trim() || "Unnamed user"}</p>
          {badges}
        </div>
        <p className="truncate text-sm text-muted-foreground" title={user.email}>
          {user.email}
        </p>
      </div>
    </div>
  );
}

function MemberBadges({ member, isYou }: { member: Member; isYou: boolean }) {
  return (
    <>
      {member.role === "ADMIN" && (
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck aria-hidden="true" />
          Moderator
        </Badge>
      )}
      {isYou && <Badge variant="outline">You</Badge>}
    </>
  );
}

function MemberActions({
  user,
  isYou,
  onBan,
  onRemove,
}: {
  user: CommunityUser;
  isYou: boolean;
  onBan: (user: CommunityUser) => Promise<boolean>;
  onRemove: (user: CommunityUser) => Promise<boolean>;
}) {
  if (isYou) {
    return <span className="text-sm text-muted-foreground">No actions for your own account</span>;
  }

  const name = displayName(user);

  return (
    <>
      <ConfirmDialog
        title={`Ban ${name}?`}
        description={
          <div className="space-y-2">
            <p>
              <span className="font-medium break-words text-foreground">{name}</span> will be removed from the community
              and blocked from joining again.
            </p>
            <p>Their existing posts and comments stay visible. You can unban them later from the Banned tab.</p>
          </div>
        }
        confirmLabel="Ban member"
        destructive
        onConfirm={() => onBan(user)}
        trigger={
          <Button variant="outline" className="h-10 md:h-9" aria-label={`Ban ${name}`}>
            <Ban aria-hidden="true" />
            Ban
          </Button>
        }
      />
      <RemoveUserDialog user={user} onRemove={onRemove} />
    </>
  );
}

function BanActions({
  user,
  unbanning,
  onUnban,
  onRemove,
}: {
  user: CommunityUser;
  unbanning: boolean;
  onUnban: (user: CommunityUser) => Promise<void>;
  onRemove: (user: CommunityUser) => Promise<boolean>;
}) {
  const name = displayName(user);
  return (
    <>
      <Button
        variant="outline"
        className="h-10 md:h-9"
        onClick={() => onUnban(user)}
        disabled={unbanning}
        aria-busy={unbanning}
        aria-label={`Unban ${name}`}
      >
        {unbanning ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
        Unban
      </Button>
      <RemoveUserDialog user={user} onRemove={onRemove} />
    </>
  );
}

function RemoveUserDialog({
  user,
  onRemove,
}: {
  user: CommunityUser;
  onRemove: (user: CommunityUser) => Promise<boolean>;
}) {
  const name = displayName(user);
  return (
    <ConfirmDialog
      title={`Remove ${name} and their content?`}
      description={
        <div className="space-y-2">
          <p>
            <span className="font-medium break-words text-foreground">{name}</span> will be removed from the community.
            All of their posts and comments here, and every reply to them, will be permanently deleted.
          </p>
          <p>
            Any ban is lifted, so they can join again while enrolled. To keep their content and block them instead, use
            Ban. This can&apos;t be undone.
          </p>
        </div>
      }
      confirmLabel="Remove and delete content"
      destructive
      onConfirm={() => onRemove(user)}
      trigger={
        <Button
          variant="outline"
          className="h-10 text-destructive hover:text-destructive md:h-9"
          aria-label={`Remove ${name} and delete their content`}
        >
          <UserRoundX aria-hidden="true" />
          Remove
        </Button>
      }
    />
  );
}

function ListEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center" role="status">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">{icon}</span>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function MemberListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading members">
      <Skeleton className="h-10 w-full rounded-lg sm:w-56" />
      <Skeleton className="h-9 w-full rounded-md sm:max-w-xs" />
      <div className="divide-y rounded-xl border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="hidden h-9 w-40 rounded-md sm:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading members…</span>
    </div>
  );
}
