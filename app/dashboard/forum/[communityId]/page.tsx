import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Lock, MessageSquare, Users } from "lucide-react";
import { getCommunity, getPosts } from "@/app/actions/community";
import { requireUser } from "@/app/data/user/require-user";
import { CommunityJoinButton } from "@/components/community/CommunityJoinButton";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { PageContainer } from "../../_components/PageContainer";
import { CreatePostForm } from "../_components/create-post-form";
import { DeletePostButton } from "../_components/DeletePostButton";

export const dynamic = "force-dynamic";

const loadCommunity = cache(getCommunity);

type Params = Promise<{ communityId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { communityId } = await params;
  const community = await loadCommunity(communityId);
  return { title: community ? `${community.name} · Forum` : "Community" };
}

export default async function CommunityPage({ params }: { params: Params }) {
  const { communityId } = await params;
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true, name: true, image: true },
  });

  if (!user) return notFound();

  const slug = communityId;
  const community = await loadCommunity(slug);

  if (!community) {
    notFound();
  }

  // Non-members of a course community may see its landing page (to join) but not its posts
  const posts = community.canViewPosts ? await getPosts(community.id) : [];

  const canDelete = (postUserId: string) =>
    user.id === postUserId ||
    (!!community.courseId && community.course?.userId === user.id) ||
    user.role === "admin";

  return (
    <PageContainer>
      <PageHeader
        backHref="/dashboard/forum"
        backLabel="All communities"
        title={<span className="break-words">{community.name}</span>}
        description={community.description ? <span className="break-words">{community.description}</span> : undefined}
        actions={
          community.isMember ? (
            <CommunityJoinButton
              communityId={community.id}
              isMember
              communityName={community.name}
              className="w-auto"
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-3">
          {community.isMember ? (
            <CreatePostForm communityId={community.id} />
          ) : (
            <Card className="border-dashed bg-muted/40 shadow-none">
              <CardContent className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                <div className="rounded-full bg-background p-3" aria-hidden="true">
                  <Users className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-semibold">Join the conversation</h2>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Become a member of this community to create posts and reply to others.
                  </p>
                </div>
                <CommunityJoinButton
                  communityId={community.id}
                  isMember={false}
                  communityName={community.name}
                  className="w-auto px-8"
                />
              </CardContent>
            </Card>
          )}

          <section aria-labelledby="posts-heading" className="space-y-4">
            <h2 id="posts-heading" className="text-xl font-semibold tracking-tight">
              Posts
            </h2>
            {!community.canViewPosts ? (
              <EmptyState
                titleAs="h3"
                icon={Lock}
                title="Members only"
                description="Join this community to read and write posts."
              />
            ) : posts.length === 0 ? (
              <EmptyState
                titleAs="h3"
                icon={MessageSquare}
                title="No posts yet"
                description="Be the first to start a conversation in this community."
              />
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Card className="relative gap-3 transition-colors hover:border-primary/50 has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <Avatar className="shrink-0">
                              <AvatarImage src={post.user.image || ""} alt="" />
                              <AvatarFallback aria-hidden="true">{post.user.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <CardTitle>
                                <h3 className="text-lg leading-snug font-semibold break-words">
                                  {/* Stretched link: the card is clickable; the delete button sits above it. */}
                                  <Link
                                    href={`/dashboard/forum/${slug}/${post.id}`}
                                    className="outline-none after:absolute after:inset-0 after:content-[''] hover:text-primary"
                                  >
                                    {post.title}
                                  </Link>
                                </h3>
                              </CardTitle>
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                                <span className="break-words">{post.user.name}</span>
                                <span aria-hidden="true">•</span>
                                <time dateTime={post.createdAt.toISOString()}>
                                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                                </time>
                              </p>
                            </div>
                          </div>
                          {canDelete(post.userId) && (
                            <div className="relative z-10">
                              <DeletePostButton postId={post.id} postTitle={post.title} />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="line-clamp-3 text-muted-foreground break-words whitespace-pre-line">
                          {post.content}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MessageSquare className="size-4" aria-hidden="true" />
                          {post._count.comments} {post._count.comments === 1 ? "comment" : "comments"}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside aria-labelledby="about-heading">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 id="about-heading" className="text-base font-semibold">
                  About
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {community.description && (
                <p className="text-sm break-words text-muted-foreground">{community.description}</p>
              )}
              <dl className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="font-medium tabular-nums">{community.memberCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Posts</dt>
                  <dd className="font-medium tabular-nums">{community._count.posts}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
