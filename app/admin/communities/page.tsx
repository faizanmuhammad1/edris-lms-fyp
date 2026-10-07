import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { IconMessageCircle, IconPlus, IconUsers, IconSchool, IconUser } from "@tabler/icons-react";
import { getCommunities } from "@/app/actions/community";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/app/data/admin/require-admin";

export default async function CommunitiesPage() {
  await requireAdmin();
  const communities = await getCommunities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Management</h1>
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
          <Card key={community.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconMessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg leading-tight">{community.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1.5">
                    {community.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  {community.course ? (
                    <>
                      <Badge variant="secondary" className="font-normal gap-1.5 px-2.5 py-0.5">
                        <IconSchool className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[140px]" title={community.course.title}>
                          {community.course.title}
                        </span>
                      </Badge>
                      {community.course.user && (
                        <Badge variant="outline" className="font-normal gap-1.5 px-2.5 py-0.5">
                          <IconUser className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[120px]" title={community.course.user.name || "Unknown"}>
                            {community.course.user.name || "Unknown"}
                          </span>
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      No course linked
                    </Badge>
                  )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <IconUsers className="h-4 w-4" />
                  {community._count.members} members
                </span>
                <span className="flex items-center gap-1.5">
                  <IconMessageCircle className="h-4 w-4" />
                  {community._count.posts} posts
                </span>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/communities/${community.slug}`}>
                  Manage
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

