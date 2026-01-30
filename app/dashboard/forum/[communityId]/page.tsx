import { getCommunity, getPosts } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { CreatePostForm } from "../_components/create-post-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  // params.communityId is actually the slug based on folder structure naming mismatch
  const { communityId } = await params;
  const slug = communityId;
  const community = await getCommunity(slug);

  if (!community) {
    notFound();
  }

  const posts = await getPosts(community.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/forum">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{community.name}</h1>
          <p className="text-muted-foreground">{community.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <CreatePostForm communityId={community.id} />

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No posts yet. Be the first to start a conversation!
              </div>
            ) : posts.map(post => (
              <Card key={post.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.user.image || ""} />
                        <AvatarFallback>{post.user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{post.user.name}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 mb-4">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post._count.comments} Comments</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{community.description}</p>
              <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Posts</span>
                  <span className="font-medium">{community._count.posts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
