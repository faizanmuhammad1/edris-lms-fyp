import { Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  /** Used to link the card's heading to its section. */
  id: string;
  title: string;
  description: ReactNode;
  icon: LucideIcon;
  /** Shown next to the title, e.g. a "Not yet enforced" badge. */
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A settings group: card with an h2 title, description and the group's controls. */
export function SettingsCard({ id, title, description, icon: Icon, badge, children, className }: SettingsCardProps) {
  const headingId = `${id}-heading`;
  return (
    <Card className={cn("shadow-xs", className)}>
      <section aria-labelledby={headingId} className="flex flex-col gap-5">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 id={headingId} className="text-base font-semibold leading-tight sm:text-lg">
                  {title}
                </h2>
                {badge}
              </div>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">{children}</CardContent>
      </section>
    </Card>
  );
}

/** Footer for a settings form: unsaved-changes hint, discard and save (enabled only when dirty). */
export function SettingsFormActions({
  isDirty,
  isSubmitting,
  onDiscard,
  saveLabel = "Save changes",
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  onDiscard: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
      <p className="text-xs text-muted-foreground sm:mr-auto" aria-live="polite">
        {isSubmitting ? "Saving…" : isDirty ? "You have unsaved changes." : "No unsaved changes."}
      </p>
      {isDirty && (
        <Button type="button" variant="ghost" onClick={onDiscard} disabled={isSubmitting}>
          Discard changes
        </Button>
      )}
      <Button type="submit" disabled={!isDirty || isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Saving…" : saveLabel}
      </Button>
    </div>
  );
}
