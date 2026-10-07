import { getPost } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { CreateCommentForm } from "../../_components/create-comment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ communityId: string; postId: string }> }) {
    const { communityId, postId } = await params;
    const post = await getPost(postId);

    if (!post) {
        notFound();
    }

    // communityId parameter (slug) usage is optional here unless we want to link back to it using the slug from URL
    // post.community.slug should match communityId (slug) usually.
    const backLink = `/dashboard/forum/${communityId}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={backLink}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                        {post.community.name}
                    </span>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={post.user.image || ""} />
                            <AvatarFallback>{post.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{post.user.name}</p>
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

                {post.canParticipate ? (
                    <CreateCommentForm postId={post.id} />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Join this community to comment.
                    </p>
                )}

                <div className="space-y-4">
                    {post.comments.map((comment) => (
                        <Card key={comment.id}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={comment.User.image || ""} />
                                            <AvatarFallback>{comment.User.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <span className="font-medium text-sm block">{comment.User.name}</span>
                                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm">{comment.text}</p>
                                {/* Nested replies could be rendered here recursively */}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
