import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata = {
  title: "Team | Edris LMS",
};

const mockTeam = [
  { id: "U1", name: "Jahanzaib", role: "Frontend Engineer" },
  { id: "U2", name: "Faizan Muhammad", role: "Backend Engineer" },
  { id: "U3", name: "Alina Imran", role: "AI ML Engineer" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function AdminTeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground">People behind the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockTeam.map((m) => (
          <Card key={m.id}>
            <CardHeader className="flex-row items-center gap-3">
              <Avatar>
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg leading-tight">
                  {m.name}
                </CardTitle>
                <CardDescription>{m.role}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Core Team Member
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
