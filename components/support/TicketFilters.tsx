"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ticketCategoryOptions, ticketStatusOptions, ticketPriorityOptions } from "@/app/data/support/schemas";
import { Search } from "lucide-react";

interface TicketFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  showPriority?: boolean;
  priority?: string;
  onPriorityChange?: (value: string) => void;
  categoryOptions?: readonly { value: string; label: string }[];
}

export function TicketFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  showPriority = false,
  priority,
  onPriorityChange,
  categoryOptions,
}: TicketFiltersProps) {
  const categories = categoryOptions || ticketCategoryOptions;
  const searchId = useId();

  return (
    <div role="search" aria-label="Filter tickets" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
        <label htmlFor={searchId} className="sr-only">
          Search tickets by subject or ticket number
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={searchId}
          type="search"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 pl-9"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-none">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 w-full data-[size=default]:h-10 sm:w-[160px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ticketStatusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-10 w-full data-[size=default]:h-10 sm:w-[180px]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showPriority && onPriorityChange && (
          <Select value={priority || "all"} onValueChange={onPriorityChange}>
            <SelectTrigger
              className="col-span-2 h-10 w-full data-[size=default]:h-10 sm:col-span-1 sm:w-[140px]"
              aria-label="Filter by priority"
            >
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {ticketPriorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
