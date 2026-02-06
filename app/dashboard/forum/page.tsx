import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconMessageCircle, IconUsers, IconClock, IconBook } from "@tabler/icons-react";
import Link from "next/link";
import { getStudentCommunities } from "@/app/actions/community";

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
          <Card key={community.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconMessageCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{community.name}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2">
                {community.description}
              </CardDescription>
              {community.course && (
                <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                  <IconBook className="h-3 w-3" />
                  <span>{community.course.title}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <IconUsers className="h-4 w-4" />
                    <span>0 members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconMessageCircle className="h-4 w-4" />
                    <span>{community._count.posts} posts</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {/* Last activity not yet in schema, omitting or mocking */}
                  <IconClock className="h-3 w-3" />
                  <span>Activity: Recently</span>
                </div>
                <Button className="w-full" asChild>
                  <Link href={`/dashboard/forum/${community.slug}`}>
                    Join Discussion
                  </Link>
                </Button>
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

