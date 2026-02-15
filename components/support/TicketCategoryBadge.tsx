import { Badge } from "@/components/ui/badge";
import { ticketCategoryOptions } from "@/app/data/support/schemas";

export function TicketCategoryBadge({ category }: { category: string }) {
  const label =
    ticketCategoryOptions.find((c) => c.value === category)?.label || category;

  return (
    <Badge variant="secondary" className="font-normal text-xs">
      {label}
    </Badge>
  );
}
