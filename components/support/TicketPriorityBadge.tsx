import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  string,
  { label: string; className: string }
> = {
  Low: {
    label: "Low",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  },
  Medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  High: {
    label: "High",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  Urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

export function TicketPriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || priorityConfig.Medium;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      <span className="sr-only">Priority: </span>
      {config.label}
    </Badge>
  );
}
