"use client";

import { MessageSquare, MessagesSquare, School, Search, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { pluralize } from "@/app/admin/_lib/format";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type CommunityGridItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  courseTitle: string | null;
  teacherName: string | null;
  memberCount: number;
  postCount: number;
};

export function CommunityGrid({ communities }: { communities: CommunityGridItem[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((c) =>
      [c.name, c.description, c.courseTitle, c.teacherName].some((value) => value?.toLowerCase().includes(q))
    );
  }, [communities, deferredQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities…"
            aria-label="Search communities by name, description, course or teacher"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {deferredQuery.trim()
            ? `${pluralize(filtered.length, "community", "communities")} found`
            : pluralize(communities.length, "community", "communities")}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center" role="status">
          <p className="text-sm text-muted-foreground">No communities match &ldquo;{deferredQuery.trim()}&rdquo;.</p>
          <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((community) => (
            <li key={community.id} className="min-w-0">
              <CommunityCard community={community} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommunityCard({ community }: { community: CommunityGridItem }) {
  const manageHref = `/admin/communities/${community.slug}`;

  return (
    <Card className="h-full gap-4 p-4 shadow-xs transition-colors hover:border-primary/40 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessagesSquare className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="truncate text-base font-semibold leading-tight" title={community.name}>
            {community.name}
          </h2>
          <p className="line-clamp-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {community.description}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-2">
        {community.courseTitle ? (
          <>
            <Badge variant="secondary" className="max-w-full gap-1.5 font-normal" title={community.courseTitle}>
              <School aria-hidden="true" />
              <span className="sr-only">Course: </span>
              <span className="truncate">{community.courseTitle}</span>
            </Badge>
            {community.teacherName && (
              <Badge variant="outline" className="max-w-full gap-1.5 font-normal" title={community.teacherName}>
                <UserRound aria-hidden="true" />
                <span className="sr-only">Teacher: </span>
                <span className="truncate">{community.teacherName}</span>
              </Badge>
            )}
          </>
        ) : (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Platform-wide · no course linked
          </Badge>
        )}
      </div>

      <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="size-4" aria-hidden="true" />
          <dt className="sr-only">Members</dt>
          <dd>{pluralize(community.memberCount, "member")}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="size-4" aria-hidden="true" />
          <dt className="sr-only">Posts</dt>
          <dd>{pluralize(community.postCount, "post")}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <Link href={manageHref} className={buttonVariants({ variant: "outline" })}>
          Manage<span className="sr-only"> {community.name}</span>
        </Link>
        <Link href={`${manageHref}/forum`} className={buttonVariants({ variant: "ghost" })}>
          View forum<span className="sr-only"> for {community.name}</span>
        </Link>
      </div>
    </Card>
  );
}
