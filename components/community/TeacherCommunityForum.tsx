"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, Users, Settings } from "lucide-react";
import Link from "next/link";
import { CreatePostForm } from "@/app/dashboard/forum/_components/create-post-form";
import { deletePost } from "@/app/actions/post";
import { DeleteButton } from "@/components/general/DeleteButton";
import { formatDistanceToNow } from "date-fns";

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

export function TeacherCommunityForum({
  community,
  posts,
  forumBasePath,
}: TeacherCommunityForumProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/teacher/communities/${community.slug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{community.name}</h1>
            <p className="text-sm text-muted-foreground">{community.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teacher/communities/${community.slug}`}>
              <Users className="mr-2 h-4 w-4" />
              Members
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teacher/communities/${community.slug}`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <CreatePostForm communityId={community.id} />

          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No posts yet. Create the first post to start the conversation.
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`${forumBasePath}/${post.id}`}
                  className="block group"
                >
                  <Card className="hover:border-primary/50 transition-all cursor-pointer group-hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={post.user.image ?? ""} />
                            <AvatarFallback>{post.user.name?.[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                              {post.title}
                            </CardTitle>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span>{post.user.name ?? "Unknown"}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        <div onClick={(e) => e.preventDefault()} className="shrink-0">
                          <DeleteButton id={post.id} deleteAction={deletePost} />
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
                </Link>
              ))
            )}
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
