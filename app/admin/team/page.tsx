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
  { id: "U1", name: "Ayesha Khan", role: "Product Manager" },
  { id: "U2", name: "Ali Raza", role: "Senior Engineer" },
  { id: "U3", name: "Sara Ahmed", role: "UI/UX Designer" },
  { id: "U4", name: "Bilal Hussain", role: "Content Lead" },
  { id: "U5", name: "Zainab Iqbal", role: "QA Engineer" },
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
                This is mock profile info for demo purposes.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
