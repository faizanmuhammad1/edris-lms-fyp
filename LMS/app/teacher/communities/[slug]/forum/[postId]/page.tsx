import { getPost } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { CreateCommentForm } from "@/app/dashboard/forum/_components/create-comment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteButton } from "@/components/general/DeleteButton";
import { deletePost } from "@/app/actions/post";

export const dynamic = "force-dynamic";

export default async function TeacherCommunityPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    notFound();
  }

  const backLink = `/teacher/communities/${slug}/forum`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backLink}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              {post.community.name}
            </span>
          </div>
        </div>
        <DeleteButton id={post.id} deleteAction={deletePost} variant="outline" size="sm" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.image ?? ""} />
              <AvatarFallback>{post.user.name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.user.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          <CardTitle className="text-2xl">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({post.comments.length})
        </h3>

        <CreateCommentForm postId={post.id} />

        <div className="space-y-4">
          {post.comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.User.image ?? ""} />
                      <AvatarFallback>{comment.User.name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-sm block">{comment.User.name ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm">{comment.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
