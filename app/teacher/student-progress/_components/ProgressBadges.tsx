import { CircleCheck, Clock, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getSeverity } from "./progress-utils";

const SUCCESS = "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
const WARNING = "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-400";
const DANGER = "border-destructive/40 bg-destructive/10 text-destructive";

export function PassBadge({ passed }: { passed: boolean }) {
  return passed ? (
    <Badge variant="outline" className={SUCCESS}>
      <CircleCheck aria-hidden="true" />
      Passed
    </Badge>
  ) : (
    <Badge variant="outline" className={DANGER}>
      <XCircle aria-hidden="true" />
      Failed
    </Badge>
  );
}

/** Integrity events for a quiz attempt, as text (count + severity), never colour alone. */
export function IntegrityBadge({ total }: { total: number }) {
  const severity = getSeverity(total);
  if (severity === "clean") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <ShieldCheck aria-hidden="true" />
        Clean
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(severity === "high" ? DANGER : severity === "medium" ? WARNING : "text-foreground")}
      title={`${severity} severity`}
    >
      <ShieldAlert aria-hidden="true" />
      {total} {total === 1 ? "event" : "events"}
      <span className="sr-only">, {severity} severity</span>
    </Badge>
  );
}

export function SubmissionStatusBadge({ status }: { status: string }) {
  return status === "Graded" ? (
    <Badge variant="outline" className={SUCCESS}>
      <CircleCheck aria-hidden="true" />
      Graded
    </Badge>
  ) : (
    <Badge variant="outline" className={WARNING}>
      <Clock aria-hidden="true" />
      Needs grading
    </Badge>
  );
}

/** Progress bar with the percentage as visible text. */
export function ScoreBar({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress value={value} aria-label={label} className="h-2 w-20 shrink-0" />
      <span className="text-sm font-medium tabular-nums">{value}%</span>
    </div>
  );
}
