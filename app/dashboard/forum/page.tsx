import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconMessageCircle, IconUsers, IconBook } from "@tabler/icons-react";
import Link from "next/link";
import { getStudentCommunities } from "@/app/actions/community";
import { CommunityJoinButton } from "@/components/community/CommunityJoinButton";

export default async function ForumPage() {
  const communities = await getStudentCommunities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
        <p className="text-muted-foreground">
          Join discussions with fellow students and share your knowledge
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => (
          <Card key={community.id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconMessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1" title={community.name}>
                      {community.name}
                    </CardTitle>
                    {/* Access to join button */}
                  </div>
                </div>
              </div>
              <CardDescription className="line-clamp-2 min-h-[40px]">
                {community.description}
              </CardDescription>
              {community.course && (
                <div className="flex items-center gap-1 mt-2 text-xs text-primary line-clamp-1">
                  <IconBook className="h-3 w-3 flex-shrink-0" />
                  <span>{community.course.title}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <IconUsers className="h-4 w-4" />
                    <span>{community.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconMessageCircle className="h-4 w-4" />
                    <span>{community._count.posts} posts</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <CommunityJoinButton
                    communityId={community.id}
                    isMember={community.isMember}
                  />

                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/dashboard/forum/${community.slug}`}>
                      View Community
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {communities.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconMessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Communities Available</h3>
            <p className="text-muted-foreground text-center">
              Communities will appear here once created.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

