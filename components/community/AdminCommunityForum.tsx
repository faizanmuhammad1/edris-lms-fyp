import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MessagesSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { formatNumber, getInitials, pluralize } from "@/app/admin/_lib/format";
import { deletePost } from "@/app/actions/post";
import { DeleteButton } from "@/components/general/DeleteButton";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  userId: string;
  user: { name: string | null; image: string | null };
  _count: { comments: number };
};

type Community = {
  id: string;
  name: string;
  description: string;
  slug: string;
  memberCount: number;
  _count: { posts: number };
};

interface AdminCommunityForumProps {
  community: Community;
  posts: Post[];
  forumBasePath: string;
}

/** Admin moderation view of a community forum: post list with delete controls. */
export function AdminCommunityForum({ community, posts, forumBasePath }: AdminCommunityForumProps) {
  const manageHref = `/admin/communities/${community.slug}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="[overflow-wrap:anywhere]">{community.name}</span>}
        description="Forum moderation: review discussions and remove posts that break the guidelines."
        backHref={manageHref}
        backLabel="Back to community"
        actions={
          <>
            <Link href={`${manageHref}?tab=members`} className={buttonVariants({ variant: "outline" })}>
              <Users className="size-4" aria-hidden="true" />
              Members
            </Link>
            <Link href={`${manageHref}?tab=settings`} className={buttonVariants({ variant: "outline" })}>
              <Settings className="size-4" aria-hidden="true" />
              Settings
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="forum-posts-heading" className="min-w-0 space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="forum-posts-heading" className="text-lg font-semibold">
              Posts
            </h2>
            <p className="text-sm text-muted-foreground">{pluralize(posts.length, "post")}</p>
          </div>

          {posts.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              titleAs="h3"
              title="No posts yet"
              description="When members start discussions they'll appear here, ready to review."
            />
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => {
                const authorName = post.user.name ?? "Unknown member";
                return (
                  <li key={post.id}>
                    <article className="relative rounded-xl border bg-card p-4 shadow-xs transition-colors focus-within:ring-2 focus-within:ring-ring/50 hover:border-primary/40 sm:p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={post.user.image ?? undefined} alt="" />
                          <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold leading-snug [overflow-wrap:anywhere]">
                            <Link
                              href={`${forumBasePath}/${post.id}`}
                              className="outline-none after:absolute after:inset-0 after:rounded-xl hover:text-primary"
                            >
                              {post.title}
                            </Link>
                          </h3>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                            <span className="max-w-full truncate">{authorName}</span>
                            <span aria-hidden="true">·</span>
                            <time dateTime={new Date(post.createdAt).toISOString()}>
                              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                            </time>
                          </p>
                        </div>
                        <div className="relative z-10 -mr-1 -mt-1 shrink-0">
                          <DeleteButton
                            id={post.id}
                            deleteAction={deletePost}
                            itemLabel="post"
                            itemName={post.title}
                            confirmDescription={
                              <>
                                <span className="font-medium text-foreground [overflow-wrap:anywhere]">
                                  &ldquo;{post.title}&rdquo;
                                </span>{" "}
                                by {authorName} and its {pluralize(post._count.comments, "comment")} will be
                                permanently deleted. This can&apos;t be undone.
                              </>
                            }
                          />
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground [overflow-wrap:anywhere]">
                        {post.content}
                      </p>
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MessageSquare className="size-4" aria-hidden="true" />
                        {pluralize(post._count.comments, "comment")}
                      </p>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside aria-labelledby="forum-about-heading" className="min-w-0">
          <Card className="gap-4 shadow-xs lg:sticky lg:top-20">
            <CardHeader className="px-4 sm:px-6">
              <h2 id="forum-about-heading" className="text-base font-semibold leading-tight">
                About this community
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <p className="whitespace-pre-line text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {community.description}
              </p>
              <dl className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="font-medium tabular-nums">{formatNumber(community.memberCount)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Posts</dt>
                  <dd className="font-medium tabular-nums">{formatNumber(community._count.posts)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
