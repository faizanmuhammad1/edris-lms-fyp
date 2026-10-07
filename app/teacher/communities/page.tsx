import { getCommunities } from "@/app/actions/community";
import { formatDate } from "@/app/teacher/_components/format";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Globe, GraduationCap, MessageSquare, MessagesSquare, Plus, Settings, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Communities" };

export const dynamic = "force-dynamic";

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export default async function TeacherCommunitiesPage() {
  const communities = await getCommunities();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communities"
        description="Discussion spaces for students enrolled in your courses. Moderate members and posts from here."
        actions={
          communities.length > 0 && (
            <Link href="/teacher/communities/create" className={buttonVariants({ className: "h-10" })}>
              <Plus aria-hidden="true" />
              Create community
            </Link>
          )
        }
      />

      {communities.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No communities yet"
          description="Create a community for one of your courses so enrolled students can ask questions, share progress and help each other."
          buttonText="Create your first community"
          href="/teacher/communities/create"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Your communities">
          {communities.map((community) => (
            <li key={community.id} className="min-w-0">
              <Card className="h-full gap-4">
                <CardHeader className="gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MessagesSquare className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="text-base font-semibold leading-snug break-words">
                        <Link
                          href={`/teacher/communities/${community.slug}`}
                          className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {community.name}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted-foreground">Created {formatDate(community.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {community.course ? (
                      <Badge variant="secondary" className="max-w-full gap-1">
                        <GraduationCap aria-hidden="true" />
                        <span className="sr-only">Course: </span>
                        <span className="min-w-0 truncate" title={community.course.title}>
                          {community.course.title}
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Globe aria-hidden="true" />
                        Platform-wide
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground break-words">{community.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4" aria-hidden="true" />
                      {plural(community._count.members, "member")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="size-4" aria-hidden="true" />
                      {plural(community._count.posts, "post")}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex-wrap gap-2">
                  <Link
                    href={`/teacher/communities/${community.slug}`}
                    className={buttonVariants({ variant: "outline", className: "h-10 min-w-0 flex-1" })}
                    aria-label={`Manage ${community.name}`}
                  >
                    <Settings aria-hidden="true" />
                    Manage
                  </Link>
                  <Link
                    href={`/teacher/communities/${community.slug}/forum`}
                    className={buttonVariants({ className: "h-10 min-w-0 flex-1" })}
                    aria-label={`Open forum for ${community.name}`}
                  >
                    <MessageSquare aria-hidden="true" />
                    Open forum
                  </Link>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
