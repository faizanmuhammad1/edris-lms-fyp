import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MessageCircle, MessagesSquare, Users } from "lucide-react";
import { getStudentCommunities } from "@/app/actions/community";
import { CommunityJoinButton } from "@/components/community/CommunityJoinButton";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "../_components/PageContainer";

export const metadata: Metadata = {
  title: "Community Forum",
};

export default async function ForumPage() {
  const communities = await getStudentCommunities();

  return (
    <PageContainer>
      <PageHeader
        title="Community forum"
        description="Join discussions with fellow students and share what you know."
      />

      {communities.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No communities yet"
          description="Communities for your courses will appear here once they're created. Enroll in a course to join its community."
          buttonText="Browse courses"
          href="/courses"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {communities.map((community) => (
            <li key={community.id} className="flex">
              <Card className="w-full gap-4 transition-shadow hover:shadow-md">
                <CardHeader className="gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                      <MessageCircle className="size-5 text-primary" />
                    </div>
                    <CardTitle className="min-w-0 pt-2">
                      <h2 className="line-clamp-2 text-lg leading-snug font-semibold break-words" title={community.name}>
                        {community.name}
                      </h2>
                    </CardTitle>
                  </div>
                  {community.description && (
                    <CardDescription className="line-clamp-3 break-words">{community.description}</CardDescription>
                  )}
                  {community.course && (
                    <p className="flex min-w-0 items-center gap-1.5 text-xs text-primary">
                      <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate" title={community.course.title}>
                        {community.course.title}
                      </span>
                    </p>
                  )}
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" aria-hidden="true" />
                      {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="size-4" aria-hidden="true" />
                      {community._count.posts} {community._count.posts === 1 ? "post" : "posts"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <CommunityJoinButton
                      communityId={community.id}
                      isMember={community.isMember}
                      communityName={community.name}
                    />
                    <Button className="w-full" variant="outline" size="lg" asChild>
                      <Link href={`/dashboard/forum/${community.slug}`}>
                        View community<span className="sr-only">: {community.name}</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
