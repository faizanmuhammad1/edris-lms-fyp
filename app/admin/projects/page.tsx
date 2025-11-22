import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Projects | Edris LMS",
};

const mockProjects = [
  {
    id: "PRJ-001",
    name: "LMS Public Website",
    owner: "Marketing",
    status: "In Progress" as const,
    due: "2025-11-30",
  },
  {
    id: "PRJ-002",
    name: "New React Course",
    owner: "Content",
    status: "Planning" as const,
    due: "2026-01-15",
  },
  {
    id: "PRJ-003",
    name: "Stripe Subscriptions",
    owner: "Engineering",
    status: "Completed" as const,
    due: "2025-10-18",
  },
];

function StatusBadge({
  status,
}: {
  status: "Planning" | "In Progress" | "Completed";
}) {
  const variant =
    status === "Completed"
      ? "default"
      : status === "In Progress"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

export default function AdminProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">
          High-level initiatives across the organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Demo data for preview purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProjects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.owner}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>{new Date(p.due).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>3 projects shown</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
