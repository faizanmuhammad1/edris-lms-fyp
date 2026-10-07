import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { getPost } from "@/app/actions/community";
import { requireUser } from "@/app/data/user/require-user";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { PageContainer } from "../../../_components/PageContainer";
import { CreateCommentForm } from "../../_components/create-comment-form";
import { DeletePostButton } from "../../_components/DeletePostButton";

export const dynamic = "force-dynamic";

const loadPost = cache(getPost);

type Params = Promise<{ communityId: string; postId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { postId } = await params;
  const post = await loadPost(postId);
  return { title: post ? `${post.title} · ${post.community.name}` : "Post" };
}

export default async function PostPage({ params }: { params: Params }) {
  const { communityId, postId } = await params;
  const post = await loadPost(postId);

  if (!post) {
    notFound();
  }

  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true },
  });
  // Authors and admins can delete from here; the server action re-checks (and also allows the course teacher).
  const canDelete = !!user && (user.id === post.userId || user.role === "admin" || post.canModerate);

  const backLink = `/dashboard/forum/${communityId}`;

  return (
    <PageContainer width="medium">
      <PageHeader
        backHref={backLink}
        backLabel={`Back to ${post.community.name}`}
        title={<span className="break-words">{post.title}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={post.user.image || ""} alt="" />
              <AvatarFallback className="text-xs" aria-hidden="true">
                {post.user.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{post.user.name}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={post.createdAt.toISOString()}>
              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
            </time>
          </span>
        }
        actions={
          canDelete ? (
            <DeletePostButton postId={post.id} postTitle={post.title} redirectTo={backLink} />
          ) : undefined
        }
      />

      <Card>
        <CardContent>
          <p className="leading-relaxed break-words whitespace-pre-wrap">{post.content}</p>
        </CardContent>
      </Card>

      <section aria-labelledby="comments-heading" className="space-y-6">
        <h2 id="comments-heading" className="flex items-center gap-2 text-xl font-semibold">
          <MessageSquare className="size-5" aria-hidden="true" />
          Comments ({post.comments.length})
        </h2>

        {post.canParticipate ? (
          <CreateCommentForm postId={post.id} />
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Join this community to comment.
          </p>
        )}

        {post.comments.length === 0 ? (
          <EmptyState
            titleAs="h3"
            icon={MessageSquare}
            title="No comments yet"
            description={post.canParticipate ? "Be the first to reply to this post." : "No one has replied yet."}
          />
        ) : (
          <ul className="space-y-4">
            {post.comments.map((comment) => (
              <li key={comment.id}>
                <Card className="py-4">
                  <CardContent className="space-y-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={comment.User.image || ""} alt="" />
                        <AvatarFallback aria-hidden="true">{comment.User.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="block text-sm font-medium break-words">{comment.User.name}</span>
                        <time dateTime={comment.createdAt.toISOString()} className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{comment.text}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
