import { getCommunity, getPosts } from "@/app/actions/community";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { CommunityJoinButton } from "@/components/community/CommunityJoinButton";
import { CreatePostForm } from "../_components/create-post-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/app/data/user/require-user";
import { deletePost } from "@/app/actions/post";
import { DeleteButton } from "@/components/general/DeleteButton";


import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true, name: true, image: true }
  });

  if (!user) return notFound();

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

      {/* Teacher/Admin Actions */}


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {community.isMember ? (
            <CreatePostForm communityId={community.id} />
          ) : (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="rounded-full bg-background p-3">
                  <IconUsers className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">Join the conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Become a member of this community to create posts and interact with others.
                  </p>
                </div>
                <CommunityJoinButton
                  communityId={community.id}
                  isMember={false}
                  className="w-auto px-8"
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No posts yet. Be the first to start a conversation!
              </div>
            ) : posts.map(post => (
              <Link key={post.id} href={`/dashboard/forum/${slug}/${post.id}`} className="block group">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group-hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.user.image || ""} />
                          <AvatarFallback>{post.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">{post.title}</CardTitle>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{post.user.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      {/* Delete button: Visible if user is author OR user is teacher of the course OR admin */}
                      {(user.id === post.userId || (community.courseId && community.course?.userId === user.id) || user.role === "admin") && (
                        <DeleteButton id={post.id} deleteAction={deletePost} />
                      )}
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
              </Link>
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
                  <span className="font-medium">{community.memberCount}</span>
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
