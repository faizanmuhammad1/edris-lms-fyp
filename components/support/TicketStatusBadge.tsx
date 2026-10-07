import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  Open: {
    label: "Open",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  InProgress: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  Escalated: {
    label: "Escalated",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  Resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  Closed: {
    label: "Closed",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
};

export function TicketStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.Open;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      <span className="sr-only">Status: </span>
      {config.label}
    </Badge>
  );
}
