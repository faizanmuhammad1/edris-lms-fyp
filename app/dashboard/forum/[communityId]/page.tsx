import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityChat } from "./_components/CommunityChat";

export default async function CommunityDiscussionPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;

  // Mock community data - replace with actual data fetching
  const community = {
    id: communityId,
    name: "Web Development Discussion",
    description: "Discuss modern web development practices, frameworks, and best practices.",
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{community.name}</h1>
        <p className="text-muted-foreground">{community.description}</p>
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden shadow-sm">
        <CardHeader className="border-b py-3.5">
          <CardTitle className="text-base font-medium">Discussion</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <CommunityChat communityId={communityId} />
        </CardContent>
      </Card>
    </div>
  );
}
