import { format, formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInitials, pluralize } from "@/app/admin/_lib/format";
import { getPost } from "@/app/actions/community";
import { deletePost } from "@/app/actions/post";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { DeleteButton } from "@/components/general/DeleteButton";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Forum post",
};

export default async function AdminCommunityPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  await requireAdmin();
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    notFound();
  }

  // Use the post's own community so the back link is right even for a mismatched URL.
  const forumHref = `/admin/communities/${post.community.slug}/forum`;
  const authorName = post.user.name ?? "Unknown member";
  const commentCount = post.comments.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="[overflow-wrap:anywhere]">{post.title}</span>}
        description={
          <>
            Posted in{" "}
            <Link href={forumHref} className="font-medium text-foreground underline-offset-4 hover:underline">
              {post.community.name}
            </Link>
          </>
        }
        backHref={forumHref}
        backLabel="Back to forum"
        actions={
          <DeleteButton
            id={post.id}
            deleteAction={deletePost}
            variant="outline"
            size="default"
            itemLabel="post"
            itemName={post.title}
            redirectTo={forumHref}
            confirmDescription={
              <>
                This post by {authorName} and its {pluralize(commentCount, "comment")} will be permanently
                deleted. This can&apos;t be undone.
              </>
            }
          />
        }
      />

      <Card className="gap-4 shadow-xs">
        <article className="space-y-4 px-4 sm:px-6" aria-label={`Post by ${authorName}`}>
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={post.user.image ?? undefined} alt="" />
              <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{authorName}</p>
              <p className="text-xs text-muted-foreground">
                <time dateTime={new Date(post.createdAt).toISOString()} title={format(post.createdAt, "PPpp")}>
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                </time>
              </p>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base [overflow-wrap:anywhere]">
            {post.content}
          </p>
        </article>
      </Card>

      <section aria-labelledby="comments-heading" className="space-y-4">
        <h2 id="comments-heading" className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="size-5 text-muted-foreground" aria-hidden="true" />
          Comments
          <span className="text-sm font-normal text-muted-foreground">({commentCount})</span>
        </h2>

        {commentCount === 0 ? (
          <EmptyState
            icon={MessageSquare}
            titleAs="h3"
            title="No comments yet"
            description="Replies from community members will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {post.comments.map((comment) => {
              const commenter = comment.User.name ?? "Unknown member";
              return (
                <li key={comment.id}>
                  <Card className="gap-3 p-4 shadow-xs">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={comment.User.image ?? undefined} alt="" />
                        <AvatarFallback className="text-xs">{getInitials(comment.User.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{commenter}</p>
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={new Date(comment.createdAt).toISOString()}>
                            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                          </time>
                        </p>
                      </div>
                    </div>
                      <p className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{comment.text}</p>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
