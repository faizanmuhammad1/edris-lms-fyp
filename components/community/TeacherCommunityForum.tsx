import { DeletePostButton } from "@/app/teacher/communities/[slug]/forum/_components/delete-post-button";
import { CreatePostForm } from "@/app/dashboard/forum/_components/create-post-form";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MessagesSquare, Settings, Users } from "lucide-react";
import Link from "next/link";

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

interface TeacherCommunityForumProps {
  community: Community;
  posts: Post[];
  forumBasePath: string;
}

function initial(name: string | null) {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

function plural(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

/** Moderator view of a community forum: start posts, browse discussions and delete posts. */
export function TeacherCommunityForum({ community, posts, forumBasePath }: TeacherCommunityForumProps) {
  const manageHref = `/teacher/communities/${community.slug}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{community.name}</span>}
        description={<span className="line-clamp-2 break-words">{community.description}</span>}
        backHref={manageHref}
        backLabel="Community overview"
        actions={
          <>
            <Link href={`${manageHref}?tab=members`} className={buttonVariants({ variant: "outline", className: "h-10" })}>
              <Users aria-hidden="true" />
              Members
            </Link>
            <Link href={`${manageHref}?tab=settings`} className={buttonVariants({ variant: "outline", className: "h-10" })}>
              <Settings aria-hidden="true" />
              Settings
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="forum-posts-heading" className="min-w-0 space-y-4">
          <CreatePostForm communityId={community.id} />

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="forum-posts-heading" className="text-lg font-semibold">
              Posts
            </h2>
            <p className="text-sm text-muted-foreground">Newest first</p>
          </div>

          {posts.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              titleAs="h3"
              title="No posts yet"
              description="Start the conversation: welcome your students, share course updates or ask a question to get discussions going."
            />
          ) : (
            <ul className="space-y-3" aria-label="Forum posts">
              {posts.map((post) => {
                const href = `${forumBasePath}/${post.id}`;
                const author = post.user.name?.trim() || "Unknown user";
                return (
                  <li key={post.id}>
                    <article className="space-y-3 rounded-xl border bg-card p-4 shadow-xs sm:p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={post.user.image ?? undefined} alt="" />
                          <AvatarFallback>{initial(post.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="font-semibold leading-snug break-words">
                            <Link
                              href={href}
                              className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                              {post.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            <span className="break-words">{author}</span>
                            <span aria-hidden="true"> · </span>
                            <time dateTime={new Date(post.createdAt).toISOString()}>
                              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                            </time>
                          </p>
                        </div>
                        <DeletePostButton
                          postId={post.id}
                          postTitle={post.title}
                          commentCount={post._count.comments}
                          display="icon"
                          className="-mr-2 -mt-2 shrink-0"
                        />
                      </div>
                      <p className="line-clamp-3 text-sm whitespace-pre-line break-words text-muted-foreground">
                        {post.content}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MessageSquare className="size-4" aria-hidden="true" />
                          {plural(post._count.comments, "comment")}
                        </span>
                        <Link href={href} className={buttonVariants({ variant: "outline", size: "sm", className: "h-9" })}>
                          View discussion
                          <span className="sr-only">: {post.title}</span>
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside aria-labelledby="forum-about-heading" className="min-w-0">
          <Card className="gap-4">
            <CardHeader>
              <h2 id="forum-about-heading" className="font-semibold leading-none">
                About this community
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm whitespace-pre-line break-words text-muted-foreground">{community.description}</p>
              <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="text-lg font-semibold tabular-nums">{community.memberCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Posts</dt>
                  <dd className="text-lg font-semibold tabular-nums">{community._count.posts}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
