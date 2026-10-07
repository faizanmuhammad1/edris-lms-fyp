import { getPost } from "@/app/actions/community";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { CornerDownRight, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommentForm } from "../_components/comment-form";
import { DeleteCommentButton } from "../_components/delete-comment-button";
import { DeletePostButton } from "../_components/delete-post-button";

export const metadata: Metadata = { title: "Forum post" };

export const dynamic = "force-dynamic";

function initial(name: string | null) {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

function RelativeTime({ date }: { date: Date }) {
  return <time dateTime={new Date(date).toISOString()}>{formatDistanceToNow(date, { addSuffix: true })}</time>;
}

export default async function TeacherCommunityPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const post = await getPost(postId);

  // Only moderators (course owner / admin) use the teacher forum view
  if (!post || !post.canModerate || post.community.slug !== slug) {
    notFound();
  }

  const forumHref = `/teacher/communities/${slug}/forum`;
  const author = post.user.name?.trim() || "Unknown user";
  const commentCount = post.comments.length;
  const authorById = new Map(post.comments.map((c) => [c.id, c.User.name?.trim() || "Unknown user"]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{post.title}</span>}
        description={
          <span className="break-words">
            Posted in <span className="font-medium text-foreground">{post.community.name}</span>
          </span>
        }
        backHref={forumHref}
        backLabel="Back to forum"
        actions={
          <DeletePostButton
            postId={post.id}
            postTitle={post.title}
            commentCount={commentCount}
            redirectTo={forumHref}
          />
        }
      />

      <div className="max-w-3xl space-y-8">
        <article aria-label="Post" className="space-y-4 rounded-xl border bg-card p-4 shadow-xs sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={post.user.image ?? undefined} alt="" />
              <AvatarFallback>{initial(post.user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium break-words">{author}</p>
              <p className="text-xs text-muted-foreground">
                <RelativeTime date={post.createdAt} />
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words sm:text-base">{post.content}</p>
        </article>

        <section aria-labelledby="comments-heading" className="space-y-4">
          <h2 id="comments-heading" className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="size-5 text-muted-foreground" aria-hidden="true" />
            Comments ({commentCount})
          </h2>

          <CommentForm postId={post.id} />

          {commentCount === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground" role="status">
              No comments yet. Be the first to reply.
            </p>
          ) : (
            <ul className="space-y-3" aria-label="Comments, newest first">
              {post.comments.map((comment) => {
                const commenter = comment.User.name?.trim() || "Unknown user";
                const replyTo = comment.parentId ? authorById.get(comment.parentId) : undefined;
                return (
                  <li key={comment.id}>
                    <article className="space-y-2 rounded-xl border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={comment.User.image ?? undefined} alt="" />
                          <AvatarFallback className="text-xs">{initial(comment.User.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium break-words">{commenter}</p>
                          <p className="text-xs text-muted-foreground">
                            <RelativeTime date={comment.createdAt} />
                          </p>
                        </div>
                        <DeleteCommentButton commentId={comment.id} authorName={commenter} />
                      </div>
                      {replyTo && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CornerDownRight className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 break-words">Replying to {replyTo}</span>
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
