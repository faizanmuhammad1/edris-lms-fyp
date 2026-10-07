"use client";

import type { ReactNode } from "react";
import { IconDotsVertical } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Row "more actions" menu with a labelled icon trigger, e.g. label="Actions for Jane Doe".
 * Non-modal so a dialog opened from an item doesn't fight the menu over focus.
 */
export function RowActionsMenu({
  label,
  heading,
  children,
  disabled,
}: {
  /** Accessible name of the trigger button; include the row's name. */
  label: string;
  /** Optional visible heading inside the menu (e.g. the row's name). */
  heading?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} title={label} disabled={disabled} className="size-9 shrink-0">
          <IconDotsVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {heading && (
          <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{heading}</DropdownMenuLabel>
        )}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
