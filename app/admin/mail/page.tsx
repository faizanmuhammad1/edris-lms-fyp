import { getMailOverview } from "@/app/data/admin/get-mail-overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { IconMail, IconUsers, IconSend, IconPlus } from "@tabler/icons-react";
import { format } from "date-fns";

export const metadata = {
  title: "Mail | Admin | Edris LMS",
};

function audienceLabel(type: string): string {
  const labels: Record<string, string> = {
    Subscribers: "Subscribers",
    AllStudents: "All students",
    CourseStudents: "Course students",
    AllTeachers: "All teachers",
    CategoryStudents: "Category students",
    LevelStudents: "Level students",
    Manual: "Manual (specific emails)",
  };
  return labels[type] ?? type;
}

export default async function AdminMailPage() {
  const { subscriberCount, campaigns, draftCount, lastSentAt } = await getMailOverview();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mail</h1>
          <p className="text-muted-foreground">Send campaigns to subscribers, students, or teachers.</p>
        </div>
        <Button asChild>
          <Link href="/admin/mail/compose" className="gap-2">
            <IconPlus className="h-4 w-4" />
            New campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subscriberCount}</p>
            <p className="text-xs text-muted-foreground">Confirmed newsletter subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <IconMail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{draftCount}</p>
            <p className="text-xs text-muted-foreground">Unsent campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last sent</CardTitle>
            <IconSend className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {lastSentAt ? (
              <>
                <p className="text-2xl font-bold">{format(new Date(lastSentAt), "MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">Most recent campaign</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">No campaigns sent yet</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Recent and draft campaigns. Click to edit or view.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No campaigns yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.subject}</TableCell>
                    <TableCell>{audienceLabel(c.audienceType)}</TableCell>
                    <TableCell>{c.recipientCount}</TableCell>
                    <TableCell>
                      {c.sentAt ? (
                        <Badge variant="secondary">Sent</Badge>
                      ) : c.recipientCount > 0 ? (
                        <Badge variant="destructive">Partially sent</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.sentAt
                        ? format(new Date(c.sentAt), "MMM d, yyyy HH:mm")
                        : format(new Date(c.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/mail/compose/${c.id}`}>
                          {c.sentAt ? "View" : c.recipientCount > 0 ? "Retry" : "Edit"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
