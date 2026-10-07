import { cn } from "@/lib/utils";

/** Position in a ranking; the top three are emphasised but the number always carries the meaning. */
export function RankBadge({ rank, className }: { rank: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        rank <= 3 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        className
      )}
    >
      <span className="sr-only">Rank </span>
      {rank}
    </span>
  );
}
