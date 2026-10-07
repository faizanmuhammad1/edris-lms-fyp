import { Archive, CircleCheck, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS = {
  Published: { label: "Published", icon: CircleCheck, variant: "default" as const },
  Draft: { label: "Draft", icon: PencilLine, variant: "secondary" as const },
  Archived: { label: "Archived", icon: Archive, variant: "outline" as const },
};

/** Course status as a text badge with an icon (never colour alone). */
export function CourseStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS[status as keyof typeof STATUS] ?? { label: status, icon: PencilLine, variant: "outline" as const };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className={cn("gap-1", className)}>
      <Icon aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
