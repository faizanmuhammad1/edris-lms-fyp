import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { IconMessageCircle, IconPlus, IconUsers } from "@tabler/icons-react";
import { getCommunities } from "@/app/actions/community";

export default async function CommunitiesPage() {
  const communities = await getCommunities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground">
            Manage and create community forums for students
          </p>
        </div>
        <Link
          href="/admin/communities/create"
          className={buttonVariants({ size: "lg" })}
        >
          <IconPlus className="mr-2 size-4" />
          Create Community
        </Link>
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
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <IconUsers className="h-4 w-4" />
                <span>0 members</span>
              </div>
              <div className="flex items-center gap-1">
                <IconMessageCircle className="h-4 w-4" />
                <span>{community._count.posts} posts</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/admin/communities/${community.slug}`}>
                    Manage
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

